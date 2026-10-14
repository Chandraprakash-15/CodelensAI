package codelens_backend;

import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@CrossOrigin(origins = "*")
public class CodeController {

    private static final int DEFAULT_TIMEOUT_SECONDS = 5;
    private static final int MAX_OUTPUT_BYTES = 64 * 1024;

    private static final Set<String> KEYWORDS = Set.of(
            "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class",
            "const", "continue", "default", "do", "double", "else", "enum", "extends", "final",
            "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int",
            "interface", "long", "native", "new", "package", "private", "protected", "public",
            "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this",
            "throw", "throws", "transient", "try", "void", "volatile", "while", "true", "false", "null",
            "Main", "String", "Scanner", "System", "Math", "Integer", "Double", "Boolean"
    );

    @PostMapping("/api/execution/run")
    public ExecutionResult runCode(@RequestBody ExecutionRequest request) {
        String code = request != null && request.getCode() != null ? request.getCode() : "";
        String stdin = request != null && request.getStdin() != null ? request.getStdin() : "";
        int timeoutSeconds = request != null && request.getTimeoutSeconds() != null && request.getTimeoutSeconds() > 0
                ? request.getTimeoutSeconds()
                : DEFAULT_TIMEOUT_SECONDS;
        return executeJava(code, stdin, timeoutSeconds);
    }

    @PostMapping("/api/execute")
    public ExecutionResult execute(@RequestBody(required = false) Object body) {
        String code = "";
        String stdin = "";
        int timeout = DEFAULT_TIMEOUT_SECONDS;
        if (body instanceof String) {
            code = (String) body;
        } else if (body instanceof java.util.Map) {
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) body;
            if (map.get("code") != null) code = map.get("code").toString();
            if (map.get("stdin") != null) stdin = map.get("stdin").toString();
            if (map.get("timeoutSeconds") != null) {
                try { timeout = Integer.parseInt(map.get("timeoutSeconds").toString()); } catch (Exception ignored) {}
            }
        }
        return executeJava(code, stdin, timeout);
    }

    private ExecutionResult executeJava(String code, String stdin, int timeoutSeconds) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codelens-");
            String traceFilePath = tempDir.resolve("trace.log").toString();

            // Step 1: Write raw user code and compile to catch genuine errors
            Path javaFile = tempDir.resolve("Main.java");
            Files.writeString(javaFile, code, StandardCharsets.UTF_8);

            Process compileRawProcess = new ProcessBuilder("javac", "-d", tempDir.toString(), javaFile.toString())
                    .redirectErrorStream(true).directory(tempDir.toFile()).start();
            String rawCompileOutput = readProcessOutput(compileRawProcess, MAX_OUTPUT_BYTES);
            int rawCompileExitCode = compileRawProcess.waitFor();

            if (rawCompileExitCode != 0) {
                Integer errorLine = parseErrorLine(rawCompileOutput);
                return new ExecutionResult("COMPILATION_ERROR", "", List.of(),
                        "Compilation Error:\n" + normalizeText(rawCompileOutput), errorLine);
            }

            // Step 2: Instrument for tracing
            writeTracerClass(tempDir);
            Path tracerFile = tempDir.resolve("codelens_backend/CodeLensTracer.java");

            boolean instrumentedCompiled = false;
            try {
                String varInstrumentedCode = instrumentCode(code);
                Files.writeString(javaFile, varInstrumentedCode, StandardCharsets.UTF_8);
                Process compileInstProcess = new ProcessBuilder("javac", "-d", tempDir.toString(),
                        tracerFile.toString(), javaFile.toString())
                        .redirectErrorStream(true).directory(tempDir.toFile()).start();
                if (compileInstProcess.waitFor() == 0) {
                    instrumentedCompiled = true;
                }
            } catch (Exception ignored) {}

            if (!instrumentedCompiled) {
                try {
                    String lineOnlyCode = instrumentCodeLineOnly(code);
                    Files.writeString(javaFile, lineOnlyCode, StandardCharsets.UTF_8);
                    Process compileLineOnly = new ProcessBuilder("javac", "-d", tempDir.toString(),
                            tracerFile.toString(), javaFile.toString())
                            .redirectErrorStream(true).directory(tempDir.toFile()).start();
                    if (compileLineOnly.waitFor() == 0) {
                        instrumentedCompiled = true;
                    }
                } catch (Exception ignored) {}
            }

            if (!instrumentedCompiled) {
                Files.writeString(javaFile, code, StandardCharsets.UTF_8);
                new ProcessBuilder("javac", "-d", tempDir.toString(), javaFile.toString())
                        .directory(tempDir.toFile()).start().waitFor();
            }

            // Step 3: Execute
            ProcessBuilder runPb = new ProcessBuilder("java",
                    "-Dcodelens.trace.file=" + traceFilePath, "-cp", tempDir.toString(), "Main")
                    .redirectErrorStream(true).directory(tempDir.toFile());
            Process runProcess = runPb.start();

            if (stdin != null && !stdin.isEmpty()) {
                try (OutputStream os = runProcess.getOutputStream()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {}
            } else {
                try { runProcess.getOutputStream().close(); } catch (IOException ignored) {}
            }

            boolean finished = runProcess.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            String output = "";

            if (!finished) {
                runProcess.destroyForcibly();
                output = readProcessOutput(runProcess, MAX_OUTPUT_BYTES);
                return new ExecutionResult("TIMEOUT", normalizeText(output), List.of(),
                        "Runtime Error: Timed out after " + timeoutSeconds + " seconds", null);
            }

            output = readProcessOutput(runProcess, MAX_OUTPUT_BYTES);
            int runExitCode = runProcess.waitFor();

            if (runExitCode != 0) {
                Integer errorLine = parseErrorLine(output);
                return new ExecutionResult("RUNTIME_ERROR", normalizeText(output), List.of(),
                        "Runtime Error:\n" + normalizeText(output), errorLine);
            }

            List<ExecutionStep> steps = readTraceSteps(tempDir.resolve("trace.log"));
            return new ExecutionResult("SUCCESS", normalizeText(output), steps, "", null);

        } catch (Exception e) {
            return new ExecutionResult("RUNTIME_ERROR", "", List.of(),
                    "Backend Error:\n" + e.getMessage(), null);
        } finally {
            deleteDirectory(tempDir);
        }
    }

    private Integer parseErrorLine(String text) {
        if (text == null) return null;
        Pattern p = Pattern.compile("Main\\.java:(\\d+):");
        Matcher m = p.matcher(text);
        if (m.find()) {
            try { return Integer.parseInt(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private void writeTracerClass(Path tempDir) throws IOException {
        Path packageDir = tempDir.resolve("codelens_backend");
        Files.createDirectories(packageDir);

        // The tracer source lives in src/main/resources/tracer/CodeLensTracer.java.template.
        // It is compiled alongside the user's code. See that file for the linked-list
        // safety properties (reflection only, no toString(), bounded + cycle-safe walk,
        // stable identity-based node ids, re-entrancy guard).
        String tracerSource;
        try (InputStream in = CodeController.class.getResourceAsStream("/tracer/CodeLensTracer.java.template")) {
            if (in == null) throw new IOException("Tracer template resource not found");
            tracerSource = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        Files.writeString(packageDir.resolve("CodeLensTracer.java"), tracerSource, StandardCharsets.UTF_8);
    }


    // ===========================
    // SCOPE TRACKING
    // ===========================

    // Each scope entry records: is this scope inside an executable method/constructor body?
    // Field declarations in class body scopes must NOT be instrumented.
    static class Scope {
        final Scope parent;
        final boolean inMethodBody; // true = inside method/constructor body (statements are executable)
        final Set<String> declaredVars = new LinkedHashSet<>();
        final Set<String> initializedVars = new LinkedHashSet<>();

        Scope(Scope parent, boolean inMethodBody) {
            this.parent = parent;
            this.inMethodBody = inMethodBody;
        }

        // A scope is instrumentable only if it is (or is descended from) a method body
        boolean isInstrumentable() {
            if (inMethodBody) return true;
            if (parent != null) return parent.isInstrumentable();
            return false;
        }

        List<String> getActiveVars() {
            List<String> list = new ArrayList<>();
            if (parent != null) {
                list.addAll(parent.getActiveVars());
            }
            for (String var : declaredVars) {
                if (initializedVars.contains(var) && !list.contains(var)) {
                    list.add(var);
                }
            }
            return list;
        }

        void markInitialized(String var) {
            if (declaredVars.contains(var)) {
                initializedVars.add(var);
            } else if (parent != null) {
                parent.markInitialized(var);
            }
        }
    }

    // ===========================
    // FULL VARIABLE INSTRUMENTATION
    // ===========================

    private String instrumentCode(String code) {
        String[] lines = code.split("\\R", -1);
        StringBuilder result = new StringBuilder();
        // Root scope: not in a method body
        Scope currentScope = new Scope(null, false);

        for (int lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            String line = lines[lineIndex];
            int lineNum = lineIndex + 1;
            String trimmed = withoutCommentsAndStrings(line).trim();

            if (trimmed.isEmpty() || trimmed.startsWith("package ") || trimmed.startsWith("import ") || trimmed.startsWith("@")) {
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Class/interface/enum header — opens a CLASS body (not instrumentable)
            if (isClassOrInterfaceOrEnum(trimmed)) {
                if (trimmed.contains("{")) {
                    currentScope = new Scope(currentScope, false); // class body
                }
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // for loop header — opens an instrumentable scope
            if (trimmed.startsWith("for ") || trimmed.startsWith("for(")) {
                // For loops are only inside method bodies; inherit instrumentability
                Scope loopScope = new Scope(currentScope, currentScope.isInstrumentable());
                extractForLoopVar(trimmed, loopScope);
                currentScope = loopScope;
                String stepCall = makeStepCall(lineNum, currentScope.isInstrumentable() ? currentScope.getActiveVars() : List.of());
                if (line.contains("{")) {
                    int braceIdx = line.indexOf('{');
                    String beforeBrace = line.substring(0, braceIdx + 1);
                    String afterBrace = line.substring(braceIdx + 1);
                    if (currentScope.isInstrumentable()) {
                        result.append(beforeBrace).append(" ").append(stepCall).append(" ").append(afterBrace).append(System.lineSeparator());
                    } else {
                        result.append(line).append(System.lineSeparator());
                    }
                } else {
                    if (currentScope.isInstrumentable()) {
                        result.append(line).append(" ").append(stepCall).append(System.lineSeparator());
                    } else {
                        result.append(line).append(System.lineSeparator());
                    }
                }
                continue;
            }

            // while loop header
            if (trimmed.startsWith("while ") || trimmed.startsWith("while(")) {
                if (trimmed.contains("{")) {
                    currentScope = new Scope(currentScope, currentScope.isInstrumentable());
                }
                if (currentScope.isInstrumentable()) {
                    String stepCall = makeStepCall(lineNum, currentScope.getActiveVars());
                    if (line.contains("{")) {
                        int braceIdx = line.indexOf('{');
                        result.append(stepCall).append(" ").append(line.substring(0, braceIdx + 1)).append(" ").append(line.substring(braceIdx + 1)).append(System.lineSeparator());
                    } else {
                        result.append(stepCall).append(" ").append(line).append(System.lineSeparator());
                    }
                } else {
                    result.append(line).append(System.lineSeparator());
                }
                continue;
            }

            // if statement
            if (trimmed.startsWith("if ") || trimmed.startsWith("if(")) {
                if (trimmed.contains("{")) {
                    currentScope = new Scope(currentScope, currentScope.isInstrumentable());
                }
                if (currentScope.isInstrumentable()) {
                    String stepCall = makeStepCall(lineNum, currentScope.getActiveVars());
                    result.append(stepCall).append(" ").append(line).append(System.lineSeparator());
                } else {
                    result.append(line).append(System.lineSeparator());
                }
                continue;
            }

            // else
            if (trimmed.startsWith("} else") || trimmed.startsWith("else ") || trimmed.equals("else")) {
                if (trimmed.contains("}") && currentScope.parent != null) currentScope = currentScope.parent;
                if (trimmed.contains("{")) currentScope = new Scope(currentScope, currentScope.isInstrumentable());
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Method / constructor signature — opens a METHOD body (instrumentable)
            if (isMethodOrConstructor(trimmed)) {
                currentScope = new Scope(currentScope, true); // method body!
                extractParams(trimmed, currentScope);
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Lone closing brace
            if (trimmed.equals("}") || trimmed.equals("};")) {
                if (currentScope.parent != null) currentScope = currentScope.parent;
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // return
            if (trimmed.startsWith("return ") || trimmed.equals("return;")) {
                if (currentScope.isInstrumentable()) {
                    String stepCall = makeStepCall(lineNum, currentScope.getActiveVars());
                    result.append(stepCall).append(" ").append(line).append(System.lineSeparator());
                } else {
                    result.append(line).append(System.lineSeparator());
                }
                continue;
            }

            // break / continue
            if (trimmed.equals("break;") || trimmed.equals("continue;")) {
                if (currentScope.isInstrumentable()) {
                    String stepCall = makeStepCall(lineNum, currentScope.getActiveVars());
                    result.append(stepCall).append(" ").append(line).append(System.lineSeparator());
                } else {
                    result.append(line).append(System.lineSeparator());
                }
                continue;
            }

            // Normal statement ending with ';'
            if (trimmed.endsWith(";")) {
                // Only instrument if inside a method body
                if (currentScope.isInstrumentable()) {
                    List<String> declared = extractDeclaredVariables(trimmed);
                    for (String var : declared) {
                        currentScope.declaredVars.add(var);
                        currentScope.initializedVars.add(var);
                    }
                    String assignedVar = extractAssignedVariable(trimmed);
                    if (assignedVar != null) currentScope.markInitialized(assignedVar);

                    String stepCall = makeStepCall(lineNum, currentScope.getActiveVars());
                    result.append(line).append(" ").append(stepCall).append(System.lineSeparator());
                } else {
                    // Class body field declaration — do NOT instrument
                    result.append(line).append(System.lineSeparator());
                }
                continue;
            }

            // Brace changes on remaining lines
            if (trimmed.contains("{")) currentScope = new Scope(currentScope, currentScope.isInstrumentable());
            if (trimmed.contains("}") && currentScope.parent != null) currentScope = currentScope.parent;
            result.append(line).append(System.lineSeparator());
        }
        return result.toString();
    }

    // ===========================
    // LINE-ONLY FALLBACK
    // ===========================

    private String instrumentCodeLineOnly(String code) {
        String[] lines = code.split("\\R", -1);
        StringBuilder result = new StringBuilder();
        // Track class depth vs method depth using a simple boolean stack
        Deque<Boolean> scopeStack = new ArrayDeque<>();
        scopeStack.push(false); // root is not a method body

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int lineNum = i + 1;
            String trimmed = withoutCommentsAndStrings(line).trim();

            if (trimmed.isEmpty() || trimmed.startsWith("package ") || trimmed.startsWith("import ") || trimmed.startsWith("@")) {
                result.append(line).append(System.lineSeparator());
                continue;
            }

            boolean inMethodBody = scopeStack.peek() != null && scopeStack.peek();

            // Class/interface/enum header
            if (isClassOrInterfaceOrEnum(trimmed)) {
                if (trimmed.contains("{")) scopeStack.push(false);
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // for loop
            if (trimmed.startsWith("for ") || trimmed.startsWith("for(")) {
                if (line.contains("{")) {
                    scopeStack.push(inMethodBody);
                    if (inMethodBody) {
                        int braceIdx = line.indexOf('{');
                        result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                              .append(line.substring(0, braceIdx + 1)).append(" codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                              .append(line.substring(braceIdx + 1)).append(System.lineSeparator());
                        continue;
                    }
                } else if (inMethodBody) {
                    result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                          .append(line).append(System.lineSeparator());
                    continue;
                }
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // while loop
            if (trimmed.startsWith("while ") || trimmed.startsWith("while(")) {
                if (line.contains("{")) scopeStack.push(inMethodBody);
                if (inMethodBody) {
                    if (line.contains("{")) {
                        int braceIdx = line.indexOf('{');
                        result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                              .append(line.substring(0, braceIdx + 1)).append(" ").append(line.substring(braceIdx + 1)).append(System.lineSeparator());
                    } else {
                        result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                              .append(line).append(System.lineSeparator());
                    }
                    continue;
                }
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // if statement
            if (trimmed.startsWith("if ") || trimmed.startsWith("if(")) {
                if (line.contains("{")) scopeStack.push(inMethodBody);
                if (inMethodBody) {
                    result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                          .append(line).append(System.lineSeparator());
                    continue;
                }
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // else
            if (trimmed.startsWith("} else") || trimmed.startsWith("else ") || trimmed.equals("else")) {
                if (trimmed.contains("}") && scopeStack.size() > 1) scopeStack.pop();
                if (trimmed.contains("{")) scopeStack.push(inMethodBody);
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Method/constructor signature
            if (isMethodOrConstructor(trimmed)) {
                if (trimmed.contains("{")) scopeStack.push(true); // method body
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // lone }
            if (trimmed.equals("}") || trimmed.equals("};")) {
                if (scopeStack.size() > 1) scopeStack.pop();
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // return / break / continue
            if (trimmed.startsWith("return ") || trimmed.equals("return;") || trimmed.equals("break;") || trimmed.equals("continue;")) {
                if (inMethodBody) {
                    result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                          .append(line).append(System.lineSeparator());
                    continue;
                }
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Statement ending with ;
            if (trimmed.endsWith(";")) {
                if (inMethodBody) {
                    result.append("codelens_backend.CodeLensTracer.step(").append(lineNum).append("); ")
                          .append(line).append(System.lineSeparator());
                    continue;
                }
                // Class body field declaration — do NOT instrument
                result.append(line).append(System.lineSeparator());
                continue;
            }

            // Brace changes
            if (trimmed.contains("{")) scopeStack.push(inMethodBody);
            if (trimmed.contains("}") && scopeStack.size() > 1) scopeStack.pop();
            result.append(line).append(System.lineSeparator());
        }
        return result.toString();
    }

    // ===========================
    // HELPERS
    // ===========================

    private static boolean isClassOrInterfaceOrEnum(String trimmed) {
        return trimmed.startsWith("public class ") || trimmed.startsWith("class ")
                || trimmed.startsWith("static class ") || trimmed.startsWith("public static class ")
                || trimmed.startsWith("private class ") || trimmed.startsWith("protected class ")
                || trimmed.startsWith("abstract class ") || trimmed.startsWith("public abstract class ")
                || trimmed.startsWith("interface ") || trimmed.startsWith("public interface ")
                || trimmed.startsWith("enum ") || trimmed.startsWith("public enum ");
    }

    private static boolean isMethodOrConstructor(String trimmed) {
        // Has parens, and body opens with {, and has access modifier / return type keywords
        // OR is a constructor (UpperCase name followed by parens)
        if (!trimmed.contains("(")) return false;
        boolean hasOpenBrace = trimmed.endsWith("{") || trimmed.contains(") {");
        if (!hasOpenBrace) return false;
        // Access modifier or common return types
        if (trimmed.contains("void ") || trimmed.contains("public ") || trimmed.contains("private ")
                || trimmed.contains("protected ") || trimmed.contains("static ")) {
            return true;
        }
        // Constructor pattern: UpperCaseName(
        int parenIdx = trimmed.indexOf('(');
        String beforeParen = trimmed.substring(0, parenIdx).trim();
        if (!beforeParen.isEmpty() && Character.isUpperCase(beforeParen.charAt(0))
                && beforeParen.matches("[A-Za-z][A-Za-z0-9_]*")) {
            return true;
        }
        return false;
    }

    private static String makeStepCall(int lineNum, List<String> activeVars) {
        StringBuilder sb = new StringBuilder();
        sb.append("codelens_backend.CodeLensTracer.step(").append(lineNum);
        for (String var : activeVars) {
            sb.append(", \"").append(var).append("\", ").append(var);
        }
        sb.append(");");
        return sb.toString();
    }

    private static void extractParams(String signature, Scope scope) {
        int openParen = signature.indexOf('(');
        int closeParen = signature.indexOf(')', openParen);
        if (openParen < 0 || closeParen <= openParen) return;
        String paramsStr = signature.substring(openParen + 1, closeParen).trim();
        if (paramsStr.isEmpty() || paramsStr.contains("String[] args")) return;
        String[] params = paramsStr.split(",");
        for (String p : params) {
            String[] parts = p.trim().split("\\s+");
            if (parts.length >= 2) {
                String name = parts[parts.length - 1];
                if (isValidIdentifier(name)) {
                    scope.declaredVars.add(name);
                    scope.initializedVars.add(name);
                }
            }
        }
    }

    private static void extractForLoopVar(String header, Scope scope) {
        int openParen = header.indexOf('(');
        int semi = header.indexOf(';', openParen);
        if (openParen < 0 || semi <= openParen) return;
        String init = header.substring(openParen + 1, semi).trim();
        for (String v : extractDeclaredVariables(init + ";")) {
            scope.declaredVars.add(v);
            scope.initializedVars.add(v);
        }
    }

    private static List<String> extractDeclaredVariables(String stmt) {
        List<String> list = new ArrayList<>();
        String cleaned = stmt.trim();
        if (cleaned.endsWith(";")) cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        Pattern p = Pattern.compile("^(?:final\\s+)?(?:byte|short|int|long|float|double|boolean|char|String|Scanner|var|[A-Z][A-Za-z0-9_]*)(?:<[^>]*>)?(?:\\s*\\[\\s*\\])*\\s+(.+)$");
        Matcher m = p.matcher(cleaned);
        if (m.matches()) {
            String decls = m.group(1);
            for (String part : splitTopLevelCommas(decls)) {
                String item = part.trim();
                int eqIdx = item.indexOf('=');
                String varName = (eqIdx >= 0 ? item.substring(0, eqIdx) : item).trim().replaceAll("\\[\\s*\\]", "").trim();
                if (isValidIdentifier(varName)) list.add(varName);
            }
        }
        return list;
    }

    private static String extractAssignedVariable(String stmt) {
        String cleaned = stmt.trim();
        if (cleaned.endsWith(";")) cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        // Skip field access assignments like head.next = ... (compound lvalue)
        Matcher m = Pattern.compile("^([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?:=|[+\\-*\\/%]=|\\+\\+|--)").matcher(cleaned);
        if (m.find()) {
            String name = m.group(1);
            if (isValidIdentifier(name)) return name;
        }
        return null;
    }

    private static List<String> splitTopLevelCommas(String text) {
        List<String> tokens = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(' || c == '[' || c == '{' || c == '<') depth++;
            else if (c == ')' || c == ']' || c == '}' || c == '>') depth--;
            else if (c == ',' && depth == 0) { tokens.add(text.substring(start, i)); start = i + 1; }
        }
        if (start < text.length()) tokens.add(text.substring(start));
        return tokens;
    }

    private static boolean isValidIdentifier(String s) {
        if (s == null || s.isEmpty() || KEYWORDS.contains(s)) return false;
        if (!Character.isJavaIdentifierStart(s.charAt(0))) return false;
        for (int i = 1; i < s.length(); i++) if (!Character.isJavaIdentifierPart(s.charAt(i))) return false;
        return true;
    }

    private static String withoutCommentsAndStrings(String line) {
        StringBuilder cleaned = new StringBuilder();
        boolean inString = false, inChar = false;
        for (int i = 0; i < line.length(); i++) {
            char current = line.charAt(i);
            char next = (i + 1 < line.length()) ? line.charAt(i + 1) : '\0';
            if (!inString && !inChar && current == '/' && next == '/') break;
            if (inString) { if (current == '\\') i++; else if (current == '"') inString = false; continue; }
            if (inChar) { if (current == '\\') i++; else if (current == '\'') inChar = false; continue; }
            if (current == '"') { inString = true; continue; }
            if (current == '\'') { inChar = true; continue; }
            cleaned.append(current);
        }
        return cleaned.toString();
    }

    private String readProcessOutput(Process process, int maxBytes) throws IOException {
        try (InputStream inputStream = process.getInputStream();
             ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            byte[] chunk = new byte[4096];
            int read;
            while ((read = inputStream.read(chunk)) != -1) {
                if (buffer.size() + read > maxBytes) { buffer.write(chunk, 0, Math.max(0, maxBytes - buffer.size())); break; }
                buffer.write(chunk, 0, read);
            }
            return normalizeText(buffer.toString(StandardCharsets.UTF_8));
        }
    }

    private String normalizeText(String value) {
        if (value == null) return "";
        return value.replace("\r\n", "\n").replace('\r', '\n');
    }

    private List<ExecutionStep> readTraceSteps(Path traceFile) {
        if (!Files.exists(traceFile)) return List.of();
        try {
            List<ExecutionStep> steps = new ArrayList<>();
            List<String> lines = Files.readAllLines(traceFile, StandardCharsets.UTF_8);
            int stepNum = 1;

            for (String lineStr : lines) {
                // ── Strip linked-list snapshot suffix ────────────────────────────
                // Format appended by tracer:  <line>\t<vars>\u0007<snapshot payload>
                // Split BEFORE trim(): the payload may end in control-char delimiters.
                String llJson = null;
                String rawLine = lineStr;
                int llIdx = rawLine.lastIndexOf('\u0007');
                if (llIdx >= 0) {
                    llJson = rawLine.substring(llIdx + 1);
                    rawLine = rawLine.substring(0, llIdx);
                }
                String trimmed = rawLine.trim();
                if (trimmed.isEmpty()) continue;

                // ── Parse line number + variable pairs ───────────────────────────
                String[] parts = trimmed.split("\t", 2);
                int lineNumber = Integer.parseInt(parts[0].trim());
                Map<String, Object> vars = new LinkedHashMap<>();
                if (parts.length > 1 && !parts[1].isBlank()) {
                    for (String entry : parts[1].split("\u0001")) {
                        if (entry.isBlank()) continue;
                        String[] nameAndTypedVal = entry.split("\u0002", 2);
                        if (nameAndTypedVal.length < 2) continue;
                        String varName = nameAndTypedVal[0];
                        String[] typeAndVal = nameAndTypedVal[1].split("\u0003", 2);
                        String type = typeAndVal[0];
                        String rawVal = typeAndVal.length > 1 ? typeAndVal[1] : "";
                        Object parsedVal;
                        switch (type) {
                            case "int":     try { parsedVal = Long.parseLong(rawVal); } catch (Exception e) { parsedVal = rawVal; } break;
                            case "double":  try { parsedVal = Double.parseDouble(rawVal); } catch (Exception e) { parsedVal = rawVal; } break;
                            case "boolean": parsedVal = Boolean.parseBoolean(rawVal); break;
                            case "char":    parsedVal = rawVal.isEmpty() ? ' ' : rawVal.charAt(0); break;
                            case "string":  parsedVal = rawVal.replace("\\n", "\n").replace("\\r", "\r").replace("\\\\", "\\"); break;
                            case "null":    parsedVal = null; break;
                            default:        parsedVal = rawVal; break;
                        }
                        vars.put(varName, parsedVal);
                    }
                }

                ExecutionStep step = new ExecutionStep(stepNum++, lineNumber, "LINE", vars);

                // ── Attach linked-list snapshot (if present) ─────────────────────
                if (llJson != null && !llJson.isEmpty()) {
                    try {
                        Map<String, Object> llMap = parseLLSnapshot(llJson);
                        step.setLinkedList(llMap);
                    } catch (Exception ignored) {
                        // Malformed snapshot — silently skip, step is still valid
                    }
                }

                steps.add(step);
            }
            return steps;
        } catch (IOException | NumberFormatException e) {
            return List.of();
        }
    }

    /**
     * Parses the linked-list payload emitted by the tracer (see
     * CodeLensTracer.captureListSnapshot). Not JSON - a fixed delimiter format:
     *   truncated SEC cycle SEC nodes SEC pointers
     *   nodes    = id FLD val FLD nextId  (ENT separated; empty nextId = null)
     *   pointers = name FLD id            (ENT separated; empty id = null)
     * Spring serialises the returned Map to JSON:
     *   {"nodes":[{"id","val","next"}],"pointers":{name:id|null},"truncated":bool,"hasCycle":bool}
     */
    private Map<String, Object> parseLLSnapshot(String payload) {
        String[] sections = payload.split("\u0006", -1);
        if (sections.length < 4) return null;

        List<Map<String, Object>> nodes = new ArrayList<>();
        if (!sections[2].isEmpty()) {
            for (String entry : sections[2].split("\u0001", -1)) {
                String[] f = entry.split("\u0002", -1);
                if (f.length < 3) continue;
                Map<String, Object> node = new LinkedHashMap<>();
                node.put("id", f[0]);
                node.put("val", Integer.parseInt(f[1]));
                node.put("next", f[2].isEmpty() ? null : f[2]);
                nodes.add(node);
            }
        }

        Map<String, Object> pointers = new LinkedHashMap<>();
        if (!sections[3].isEmpty()) {
            for (String entry : sections[3].split("\u0001", -1)) {
                String[] f = entry.split("\u0002", -1);
                if (f.length < 1 || f[0].isEmpty()) continue;
                pointers.put(f[0], (f.length < 2 || f[1].isEmpty()) ? null : f[1]);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("nodes", nodes);
        result.put("pointers", pointers);
        result.put("truncated", "1".equals(sections[0]));
        result.put("hasCycle", "1".equals(sections[1]));
        return result;
    }

    private void deleteDirectory(Path path) {
        if (path == null || !Files.exists(path)) return;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(path)) {
            for (Path child : stream) deleteDirectory(child);
        } catch (IOException ignored) {}
        try { Files.deleteIfExists(path); } catch (IOException ignored) {}
    }
}

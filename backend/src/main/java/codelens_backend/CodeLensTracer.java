package codelens_backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CodeLensTracer {

    private static final List<String> STEPS = Collections.synchronizedList(new ArrayList<>());
    private static final int MAX_STEPS = 5000;

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(CodeLensTracer::flush));
    }

    public static void step(int line) {
        step(line, (Object[]) null);
    }

    public static void step(int line, Object... varPairs) {
        if (STEPS.size() >= MAX_STEPS) {
            return;
        }
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(line);
            if (varPairs != null && varPairs.length > 0) {
                sb.append("\t");
                for (int i = 0; i < varPairs.length; i += 2) {
                    if (i > 0) sb.append("\u0001");
                    String name = String.valueOf(varPairs[i]);
                    Object val = (i + 1 < varPairs.length) ? varPairs[i + 1] : null;
                    sb.append(name).append("\u0002");
                    if (val == null) {
                        sb.append("null\u0003null");
                    } else if (val instanceof Integer || val instanceof Long || val instanceof Short || val instanceof Byte) {
                        sb.append("int\u0003").append(val.toString());
                    } else if (val instanceof Double || val instanceof Float) {
                        sb.append("double\u0003").append(val.toString());
                    } else if (val instanceof Boolean) {
                        sb.append("boolean\u0003").append(val.toString());
                    } else if (val instanceof Character) {
                        sb.append("char\u0003").append(val.toString());
                    } else if (val instanceof String) {
                        String s = ((String) val).replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r");
                        sb.append("string\u0003").append(s);
                    } else {
                        String s = val.toString().replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r");
                        sb.append("object\u0003").append(s);
                    }
                }
            }
            STEPS.add(sb.toString());
        } catch (Throwable ignored) {}
    }

    public static void flush() {
        String traceFile = System.getProperty("codelens.trace.file");
        if (traceFile == null || traceFile.isBlank()) {
            return;
        }
        try {
            StringBuilder sb = new StringBuilder();
            synchronized (STEPS) {
                for (String stepStr : STEPS) {
                    sb.append(stepStr).append(System.lineSeparator());
                }
            }
            Files.writeString(
                    Path.of(traceFile),
                    sb.toString(),
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );
        } catch (Throwable ignored) {}
    }

    public static void clear() {
        STEPS.clear();
    }
}
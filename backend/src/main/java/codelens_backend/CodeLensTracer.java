package codelens_backend;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.*;

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
                    sb.append(encodeValue(val, new IdentityHashMap<>(), 0));
                }
            }
            STEPS.add(sb.toString());
        } catch (Throwable ignored) {}
    }

    // ── Value encoder ──────────────────────────────────────────────────────────

    private static String encodeValue(Object val, IdentityHashMap<Object, Boolean> seen, int depth) {
        if (val == null) {
            return "null\u0003null";
        }
        if (val instanceof Integer || val instanceof Long || val instanceof Short || val instanceof Byte) {
            return "int\u0003" + val;
        }
        if (val instanceof Double || val instanceof Float) {
            return "double\u0003" + val;
        }
        if (val instanceof Boolean) {
            return "boolean\u0003" + val;
        }
        if (val instanceof Character) {
            return "char\u0003" + val;
        }
        if (val instanceof String) {
            String s = ((String) val).replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r");
            return "string\u0003" + s;
        }

        // ── Collections ──────────────────────────────────────────────────────
        if (val instanceof Collection<?>) {
            return "string\u0003" + collectionToString((Collection<?>) val, seen, depth);
        }
        if (val instanceof Map<?, ?>) {
            return "string\u0003" + mapToString((Map<?, ?>) val, seen, depth);
        }

        // ── Arrays ──────────────────────────────────────────────────────────
        if (val.getClass().isArray()) {
            return "string\u0003" + arrayToString(val, seen, depth);
        }

        // ── Custom objects (linked list nodes, tree nodes, etc.) ─────────────
        if (seen.containsKey(val)) {
            return "object\u0003{...}";
        }
        if (depth >= 6) {
            return "object\u0003{" + simpleClassName(val) + "}";
        }
        seen.put(val, Boolean.TRUE);
        String result = "object\u0003" + objectToString(val, seen, depth);
        seen.remove(val);
        return result;
    }

    /** Serialize object fields via reflection */
    private static String objectToString(Object obj, IdentityHashMap<Object, Boolean> seen, int depth) {
        StringBuilder sb = new StringBuilder();
        sb.append(simpleClassName(obj)).append("{");

        List<Field> fields = new ArrayList<>();
        Class<?> c = obj.getClass();
        while (c != null && c != Object.class) {
            for (Field f : c.getDeclaredFields()) {
                if (!Modifier.isStatic(f.getModifiers())) {
                    fields.add(f);
                }
            }
            c = c.getSuperclass();
        }

        boolean first = true;
        for (Field field : fields) {
            try {
                field.setAccessible(true);
                Object fieldVal = field.get(obj);
                if (!first) sb.append(", ");
                first = false;
                sb.append(field.getName()).append(": ");
                String encoded = encodeValue(fieldVal, seen, depth + 1);
                sb.append(extractDisplayValue(encoded));
            } catch (Exception ignored) {}
        }
        sb.append("}");
        return sb.toString();
    }

    /** Extracts display part after type prefix  e.g. "int\u000342" -> "42" */
    private static String extractDisplayValue(String encoded) {
        int sep = encoded.indexOf('\u0003');
        if (sep >= 0) {
            String type = encoded.substring(0, sep);
            String val  = encoded.substring(sep + 1);
            if (type.equals("string")) return "\"" + val + "\"";
            return val;
        }
        return encoded;
    }

    private static String simpleClassName(Object obj) {
        String name = obj.getClass().getSimpleName();
        int dollar = name.lastIndexOf('$');
        if (dollar >= 0) name = name.substring(dollar + 1);
        return name;
    }

    private static String arrayToString(Object arr, IdentityHashMap<Object, Boolean> seen, int depth) {
        int len = Array.getLength(arr);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < Math.min(len, 32); i++) {
            if (i > 0) sb.append(", ");
            sb.append(extractDisplayValue(encodeValue(Array.get(arr, i), seen, depth + 1)));
        }
        if (len > 32) sb.append(", ...(").append(len - 32).append(" more)");
        sb.append("]");
        return sb.toString();
    }

    private static String collectionToString(Collection<?> col, IdentityHashMap<Object, Boolean> seen, int depth) {
        StringBuilder sb = new StringBuilder("[");
        int count = 0;
        for (Object elem : col) {
            if (count > 0) sb.append(", ");
            sb.append(extractDisplayValue(encodeValue(elem, seen, depth + 1)));
            if (++count >= 32) { sb.append(", ..."); break; }
        }
        sb.append("]");
        return sb.toString();
    }

    private static String mapToString(Map<?, ?> map, IdentityHashMap<Object, Boolean> seen, int depth) {
        StringBuilder sb = new StringBuilder("{");
        int count = 0;
        for (Map.Entry<?, ?> e : map.entrySet()) {
            if (count > 0) sb.append(", ");
            sb.append(extractDisplayValue(encodeValue(e.getKey(), seen, depth + 1)));
            sb.append(": ");
            sb.append(extractDisplayValue(encodeValue(e.getValue(), seen, depth + 1)));
            if (++count >= 32) { sb.append(", ..."); break; }
        }
        sb.append("}");
        return sb.toString();
    }

    // ── Flush ──────────────────────────────────────────────────────────────────

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
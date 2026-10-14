package codelens_backend;

public class ExecutionRequest {
    private String code;
    private String stdin;
    private Integer timeoutSeconds;

    public ExecutionRequest() {}

    public ExecutionRequest(String code, String stdin, Integer timeoutSeconds) {
        this.code = code;
        this.stdin = stdin;
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getStdin() {
        return stdin;
    }

    public void setStdin(String stdin) {
        this.stdin = stdin;
    }

    public Integer getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(Integer timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }
}

package codelens_backend;

import java.util.List;

public class ExecutionResult {

    private String status;
    private String output;
    private List<ExecutionStep> steps;
    private String error;
    private Integer errorLine;

    public ExecutionResult() {}

    public ExecutionResult(
            String status,
            String output,
            List<ExecutionStep> steps,
            String error,
            Integer errorLine
    ) {
        this.status = status;
        this.output = output;
        this.steps = steps;
        this.error = error;
        this.errorLine = errorLine;
    }

    public ExecutionResult(
            String output,
            List<ExecutionStep> steps,
            String error
    ) {
        this(error != null && !error.isEmpty() ? (error.contains("Compilation") ? "COMPILATION_ERROR" : "RUNTIME_ERROR") : "SUCCESS",
             output, steps, error, null);
    }

    public String getStatus() {
        return status;
    }

    public String getOutput() {
        return output;
    }

    public List<ExecutionStep> getSteps() {
        return steps;
    }

    public String getError() {
        return error;
    }

    public Integer getErrorLine() {
        return errorLine;
    }
}

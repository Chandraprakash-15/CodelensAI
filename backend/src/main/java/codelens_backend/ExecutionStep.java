package codelens_backend;

import java.util.Map;

public class ExecutionStep {

    private int stepNumber;
    private int lineNumber;
    private String eventType = "LINE";
    private Map<String, Object> variables;

    /**
     * Linked-list structural snapshot for this step.
     *
     * Present only when one or more variables hold a linked-list node
     * (detected via reflection: has {@code int val} + same-class {@code next}).
     *
     * Shape (matches the TypeScript LinkedListSnapshot type):
     * <pre>
     * {
     *   "nodes": [
     *     {"id": "node-1", "val": 1, "next": "node-2"},
     *     {"id": "node-2", "val": 2, "next": null}
     *   ],
     *   "pointers": {
     *     "head": "node-1",
     *     "curr": "node-2",
     *     "prev": null
     *   }
     * }
     * </pre>
     *
     * null when no list nodes are in scope.
     */
    private Map<String, Object> linkedList;

    public ExecutionStep() {}

    public ExecutionStep(int stepNumber, int lineNumber) {
        this.stepNumber = stepNumber;
        this.lineNumber = lineNumber;
        this.eventType = "LINE";
    }

    public ExecutionStep(int lineNumber, Map<String, Object> variables) {
        this.lineNumber = lineNumber;
        this.variables = variables;
        this.eventType = "LINE";
    }

    public ExecutionStep(int stepNumber, int lineNumber, String eventType) {
        this.stepNumber = stepNumber;
        this.lineNumber = lineNumber;
        this.eventType = eventType;
    }

    public ExecutionStep(int stepNumber, int lineNumber, String eventType, Map<String, Object> variables) {
        this.stepNumber = stepNumber;
        this.lineNumber = lineNumber;
        this.eventType = eventType;
        this.variables = variables;
    }

    public int getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(int stepNumber) {
        this.stepNumber = stepNumber;
    }

    public int getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(int lineNumber) {
        this.lineNumber = lineNumber;
    }

    public int getLine() {
        return lineNumber;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Map<String, Object> getVariables() {
        return variables;
    }

    public void setVariables(Map<String, Object> variables) {
        this.variables = variables;
    }

    public Map<String, Object> getLinkedList() {
        return linkedList;
    }

    public void setLinkedList(Map<String, Object> linkedList) {
        this.linkedList = linkedList;
    }
}
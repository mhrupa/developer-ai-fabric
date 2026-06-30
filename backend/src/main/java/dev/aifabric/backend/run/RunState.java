package dev.aifabric.backend.run;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class RunState {

    private final String runId;
    private final String workflowId;
    private final String workflowName;
    private final Map<String, Object> input;
    private final Instant createdAt;
    private final List<Map<String, Object>> steps = new ArrayList<>();
    private final List<Map<String, Object>> events = new ArrayList<>();

    public RunState(String runId, String workflowId, String workflowName, Map<String, Object> input) {
        this.runId = runId;
        this.workflowId = workflowId;
        this.workflowName = workflowName;
        this.input = input;
        this.createdAt = Instant.now();
    }

    public String runId() {
        return runId;
    }

    public Map<String, Object> input() {
        return input;
    }

    public List<Map<String, Object>> steps() {
        return steps;
    }

    public void addEvent(String type, Map<String, Object> payload) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", type + "-" + UUID.randomUUID());
        event.put("type", type);
        event.put("runId", runId);
        event.put("createdAt", Instant.now().toString());
        event.putAll(payload);
        events.add(event);
    }

    public void addStep(StepExecution step) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id", step.id());
        entry.put("agent", step.agent());
        entry.put("agentName", step.agentName());
        entry.put("status", step.status());
        entry.put("startedAt", step.startedAt());
        entry.put("completedAt", step.completedAt());
        entry.put("contract", step.contract());
        entry.put("output", step.output());
        steps.add(entry);
    }

    public Map<String, Object> complete(Map<String, Object> result) {
        Map<String, Object> run = new LinkedHashMap<>();
        run.put("runId", runId);
        run.put("workflow", workflowId);
        run.put("workflowName", workflowName);
        run.put("status", "completed");
        run.put("input", input);
        run.put("createdAt", createdAt.toString());
        run.put("completedAt", Instant.now().toString());
        run.put("steps", steps);
        run.put("events", events);
        run.put("result", result);
        return run;
    }
}

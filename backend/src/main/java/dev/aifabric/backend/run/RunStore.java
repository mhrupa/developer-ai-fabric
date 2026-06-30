package dev.aifabric.backend.run;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class RunStore {

    private final FabricProperties properties;
    private final ObjectMapper objectMapper;

    public RunStore(FabricProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public void save(Map<String, Object> run) throws IOException {
        Files.createDirectories(properties.runStoreDir());
        String runId = String.valueOf(run.get("runId"));
        objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(properties.runStoreDir().resolve(runId + ".json").toFile(), run);
    }

    public Optional<Map<String, Object>> get(String runId) throws IOException {
        Path path = properties.runStoreDir().resolve(runId + ".json");
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        return Optional.of(objectMapper.readValue(path.toFile(), Map.class));
    }

    public Map<String, Object> approve(String runId, String approver) throws IOException {
        Map<String, Object> run = requiredRun(runId);
        Map<String, Object> approval = new LinkedHashMap<>();
        approval.put("status", "approved");
        approval.put("approvedBy", approver == null || approver.isBlank() ? "local-user" : approver);
        approval.put("approvedAt", Instant.now().toString());
        approval.put("requiredFor", List.of("post-to-jira"));
        run.put("approval", approval);
        addEvent(run, "approval.granted", Map.of("approvedBy", approval.get("approvedBy")));
        save(run);
        return run;
    }

    public Map<String, Object> replaceStep(String runId, StepExecution execution) throws IOException {
        Map<String, Object> run = requiredRun(runId);
        List<Map<String, Object>> steps = listValue(run.get("steps"));
        boolean replaced = false;
        for (int index = 0; index < steps.size(); index += 1) {
            if (execution.id().equals(stringValue(steps.get(index).get("id")))) {
                steps.set(index, stepMap(execution));
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            throw new IllegalArgumentException("Run step not found: " + execution.id());
        }
        run.put("steps", steps);
        addEvent(run, "step.rerun", Map.of("stepId", execution.id(), "agent", execution.agent()));
        save(run);
        return run;
    }

    public List<RunSummary> list() throws IOException {
        if (!Files.isDirectory(properties.runStoreDir())) {
            return List.of();
        }

        try (var paths = Files.list(properties.runStoreDir())) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .map(this::readSummary)
                    .sorted(Comparator.comparing(RunSummary::createdAt).reversed())
                    .toList();
        }
    }

    private RunSummary readSummary(Path path) {
        try {
            Map<String, Object> run = objectMapper.readValue(path.toFile(), Map.class);
            Map<String, Object> input = mapValue(run.get("input"));
            return new RunSummary(
                    stringValue(run.get("runId")),
                    stringValue(run.get("workflow")),
                    stringValue(run.get("status")),
                    stringValue(input.get("jiraIssueKey")),
                    stringValue(input.get("service")),
                    Instant.parse(stringValue(run.get("createdAt")))
            );
        } catch (IOException error) {
            throw new IllegalStateException("Failed to read run file: " + path, error);
        }
    }

    private Map<String, Object> requiredRun(String runId) throws IOException {
        return get(runId).orElseThrow(() -> new IllegalArgumentException("Run not found: " + runId));
    }

    private void addEvent(Map<String, Object> run, String type, Map<String, Object> data) {
        List<Map<String, Object>> events = listValue(run.get("events"));
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", type + "-" + UUID.randomUUID());
        event.put("type", type);
        event.put("runId", run.get("runId"));
        event.put("createdAt", Instant.now().toString());
        event.putAll(data);
        events.add(event);
        run.put("events", events);
    }

    private static Map<String, Object> stepMap(StepExecution execution) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("id", execution.id());
        step.put("agent", execution.agent());
        step.put("agentName", execution.agentName());
        step.put("status", execution.status());
        step.put("startedAt", execution.startedAt());
        step.put("completedAt", execution.completedAt());
        step.put("contract", execution.contract());
        step.put("output", execution.output());
        return step;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listValue(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> maps = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    maps.add((Map<String, Object>) map);
                }
            }
            return maps;
        }
        return new ArrayList<>();
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}

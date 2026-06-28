package dev.aifabric.backend.api;

import dev.aifabric.backend.deck.DeckService;
import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import dev.aifabric.backend.run.RunRequest;
import dev.aifabric.backend.run.RunStore;
import dev.aifabric.backend.run.StepExecution;
import dev.aifabric.backend.run.WorkflowRunner;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/runs")
public class RunController {

    private final DeckService deckService;
    private final WorkflowRunner workflowRunner;
    private final RunStore runStore;

    public RunController(DeckService deckService, WorkflowRunner workflowRunner, RunStore runStore) {
        this.deckService = deckService;
        this.workflowRunner = workflowRunner;
        this.runStore = runStore;
    }

    @GetMapping
    public Map<String, Object> list() throws IOException {
        return Map.of("runs", runStore.list());
    }

    @GetMapping("/{runId}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String runId) throws IOException {
        return runStore.get(runId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody RunRequest request) throws IOException {
        WorkflowDefinition workflow = deckService.workflows().stream()
                .filter(item -> request.workflow().equals(item.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + request.workflow()));

        Map<String, Object> run = workflowRunner.run(workflow, deckService.agents(), request.input() == null ? Map.of() : request.input());
        runStore.save(run);
        return ResponseEntity.status(201).body(run);
    }

    @PostMapping("/{runId}/approve")
    public Map<String, Object> approve(@PathVariable String runId, @RequestBody(required = false) Map<String, Object> request) throws IOException {
        String approver = request == null ? "local-user" : Objects.toString(request.getOrDefault("approver", "local-user"));
        return runStore.approve(runId, approver);
    }

    @PostMapping("/{runId}/steps/{stepId}/rerun")
    public Map<String, Object> rerunStep(@PathVariable String runId, @PathVariable String stepId) throws IOException {
        Map<String, Object> run = runStore.get(runId)
                .orElseThrow(() -> new IllegalArgumentException("Run not found: " + runId));
        String workflowId = Objects.toString(run.get("workflow"), "");
        WorkflowDefinition workflow = workflowById(workflowId);
        WorkflowStep step = workflow.steps().stream()
                .filter(item -> stepId.equals(item.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Workflow step not found: " + stepId));
        AgentDefinition agent = deckService.agents().stream()
                .filter(item -> step.agent().equals(item.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Workflow agent not found: " + step.agent()));

        StepExecution execution = workflowRunner.runStep(step, agent, mapValue(run.get("input")));
        return runStore.replaceStep(runId, execution);
    }

    private WorkflowDefinition workflowById(String workflowId) throws IOException {
        return deckService.workflows().stream()
                .filter(item -> workflowId.equals(item.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}

package dev.aifabric.backend.api;

import dev.aifabric.backend.deck.DeckService;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.run.RunRequest;
import dev.aifabric.backend.run.RunStore;
import dev.aifabric.backend.run.WorkflowRunner;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
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
}

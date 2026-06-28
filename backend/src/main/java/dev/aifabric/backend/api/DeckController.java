package dev.aifabric.backend.api;

import dev.aifabric.backend.deck.DeckService;
import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.KbSourceDefinition;
import dev.aifabric.backend.deck.SkillDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import java.io.IOException;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class DeckController {

    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @GetMapping("/agents")
    public Map<String, Object> agents() throws IOException {
        return Map.of("agents", deckService.agents());
    }

    @PostMapping("/agents")
    public Map<String, Object> createAgent(@RequestBody AgentDefinition agent) throws IOException {
        return Map.of("agent", deckService.saveAgent(agent));
    }

    @GetMapping("/skills")
    public Map<String, Object> skills() throws IOException {
        return Map.of("skills", deckService.skills());
    }

    @PostMapping("/skills")
    public Map<String, Object> createSkill(@RequestBody SkillDefinition skill) throws IOException {
        return Map.of("skill", deckService.saveSkill(skill));
    }

    @GetMapping("/workflows")
    public Map<String, Object> workflows() throws IOException {
        return Map.of("workflows", deckService.workflows());
    }

    @PostMapping("/workflows")
    public Map<String, Object> createWorkflow(@RequestBody WorkflowDefinition workflow) throws IOException {
        return Map.of("workflow", deckService.saveWorkflow(workflow));
    }

    @PutMapping("/workflows/{id}")
    public Map<String, Object> updateWorkflow(@PathVariable String id, @RequestBody WorkflowDefinition workflow) throws IOException {
        WorkflowDefinition normalized = new WorkflowDefinition(
                id,
                workflow.name(),
                workflow.description(),
                workflow.orchestration(),
                workflow.steps(),
                workflow.file()
        );
        return Map.of("workflow", deckService.saveWorkflow(normalized));
    }

    @GetMapping("/kb/sources")
    public Map<String, Object> kbSources() throws IOException {
        return Map.of("sources", deckService.kbSources());
    }

    @PostMapping("/kb/sources")
    public Map<String, Object> createKbSource(@RequestBody KbSourceDefinition source) throws IOException {
        return Map.of("source", deckService.saveKbSource(source));
    }
}

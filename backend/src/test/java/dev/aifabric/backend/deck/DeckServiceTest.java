package dev.aifabric.backend.deck;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.aifabric.backend.config.FabricProperties;
import java.util.List;
import java.util.Map;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class DeckServiceTest {

    @Test
    void loadsAgentsAndWorkflowsFromWorkspaceDeck() throws Exception {
        Path workspace = Path.of("..").toAbsolutePath().normalize();
        DeckService deckService = new DeckService(testProperties(workspace));

        assertThat(deckService.agents()).extracting(AgentDefinition::id).contains("bug-intake", "rca-writer");
        assertThat(deckService.workflows()).extracting(WorkflowDefinition::id).contains("rca-analysis");
    }

    @Test
    void rejectsWorkflowWithUnknownAgent() {
        Path workspace = Path.of("..").toAbsolutePath().normalize();
        DeckService deckService = new DeckService(testProperties(workspace));
        WorkflowDefinition workflow = new WorkflowDefinition(
                "invalid-workflow",
                "Invalid Workflow",
                "Should not save",
                Map.of("requireApprovalForSideEffects", true),
                List.of(new WorkflowStep("unknown-step", "missing-agent", List.of())),
                null
        );

        assertThatThrownBy(() -> deckService.saveWorkflow(workflow))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown workflow agent");
    }

    @Test
    void rejectsWorkflowWithDisabledSideEffectApproval() {
        Path workspace = Path.of("..").toAbsolutePath().normalize();
        DeckService deckService = new DeckService(testProperties(workspace));
        WorkflowDefinition workflow = new WorkflowDefinition(
                "unsafe-workflow",
                "Unsafe Workflow",
                "Should not save",
                Map.of("requireApprovalForSideEffects", false),
                List.of(new WorkflowStep("bug-intake", "bug-intake", List.of())),
                null
        );

        assertThatThrownBy(() -> deckService.saveWorkflow(workflow))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("side-effect approval must remain enabled");
    }

    @Test
    void rejectsWorkflowWithDependencyCycle() {
        Path workspace = Path.of("..").toAbsolutePath().normalize();
        DeckService deckService = new DeckService(testProperties(workspace));
        WorkflowDefinition workflow = new WorkflowDefinition(
                "cycle-workflow",
                "Cycle Workflow",
                "Should not save",
                Map.of("requireApprovalForSideEffects", true),
                List.of(
                        new WorkflowStep("bug-intake", "bug-intake", List.of("rca-writer")),
                        new WorkflowStep("rca-writer", "rca-writer", List.of("bug-intake"))
                ),
                null
        );

        assertThatThrownBy(() -> deckService.saveWorkflow(workflow))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cycle");
    }

    private static FabricProperties testProperties(Path workspace) {
        return new FabricProperties(workspace, workspace.resolve(".developer-ai-fabric/runs-test"), "", "", "", "", "", "", "");
    }
}

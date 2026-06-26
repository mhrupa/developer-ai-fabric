package dev.aifabric.backend.deck;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aifabric.backend.config.FabricProperties;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class DeckServiceTest {

    @Test
    void loadsAgentsAndWorkflowsFromWorkspaceDeck() throws Exception {
        Path workspace = Path.of("..").toAbsolutePath().normalize();
        DeckService deckService = new DeckService(new FabricProperties(workspace, workspace.resolve(".developer-ai-fabric/runs-test")));

        assertThat(deckService.agents()).extracting(AgentDefinition::id).contains("bug-intake", "rca-writer");
        assertThat(deckService.workflows()).extracting(WorkflowDefinition::id).contains("rca-analysis");
    }
}

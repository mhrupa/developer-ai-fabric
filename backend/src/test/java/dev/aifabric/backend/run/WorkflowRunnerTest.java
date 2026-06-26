package dev.aifabric.backend.run;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class WorkflowRunnerTest {

    @Test
    void createsMockRcaRun() {
        WorkflowDefinition workflow = new WorkflowDefinition(
                "rca-analysis",
                "RCA Analysis",
                "Test workflow",
                Map.of(),
                List.of(new WorkflowStep("bug-intake", "bug-intake")),
                "rca-analysis.workflow.yaml"
        );
        AgentDefinition agent = new AgentDefinition(
                "bug-intake",
                "Bug Intake Agent",
                "Extracts bug details",
                "1.0.0",
                Map.of(),
                List.of(),
                List.of(),
                "bug-intake.agent.yaml"
        );

        Map<String, Object> run = new WorkflowRunner().run(
                workflow,
                List.of(agent),
                Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod")
        );

        assertThat(run.get("status")).isEqualTo("completed");
        assertThat(run.get("runId").toString()).startsWith("BUG-1234-");
        assertThat((List<?>) run.get("steps")).hasSize(1);
        Map<?, ?> result = (Map<?, ?>) run.get("result");
        assertThat(result.get("confidence")).isEqualTo("low");
    }
}

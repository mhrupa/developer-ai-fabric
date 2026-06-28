package dev.aifabric.backend.run;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aifabric.backend.config.FabricProperties;
import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class WorkflowRunnerTest {

    @TempDir
    Path tempDir;

    @Test
    void createsMockRcaRun() {
        WorkflowDefinition workflow = new WorkflowDefinition(
                "rca-analysis",
                "RCA Analysis",
                "Test workflow",
                Map.of(),
                List.of(new WorkflowStep("bug-intake", "bug-intake", List.of())),
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

        Map<String, Object> run = new WorkflowRunner(new MockStepRunner()).run(
                workflow,
                List.of(agent),
                Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod")
        );

        assertThat(run.get("status")).isEqualTo("completed");
        assertThat(run.get("runId").toString()).startsWith("BUG-1234-");
        assertThat((List<?>) run.get("steps")).hasSize(1);
        Map<?, ?> result = (Map<?, ?>) run.get("result");
        assertThat(result.get("confidence")).isEqualTo("low");
        assertThat(((Map<?, ?>) run.get("approval")).get("status")).isEqualTo("pending");
    }

    @Test
    void persistsApprovalAndRerunStep() throws Exception {
        RunStore runStore = new RunStore(new FabricProperties(tempDir, tempDir.resolve("runs")));
        WorkflowStep step = new WorkflowStep("bug-intake", "bug-intake", List.of());
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
        WorkflowDefinition workflow = new WorkflowDefinition(
                "rca-analysis",
                "RCA Analysis",
                "Test workflow",
                Map.of(),
                List.of(step),
                "rca-analysis.workflow.yaml"
        );
        WorkflowRunner runner = new WorkflowRunner(new MockStepRunner());
        Map<String, Object> run = runner.run(
                workflow,
                List.of(agent),
                Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod")
        );
        String runId = run.get("runId").toString();
        runStore.save(run);

        Map<String, Object> approved = runStore.approve(runId, "reviewer");
        assertThat(((Map<?, ?>) approved.get("approval")).get("status")).isEqualTo("approved");

        StepExecution rerun = runner.runStep(step, agent, Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod"));
        Map<String, Object> updated = runStore.replaceStep(runId, rerun);
        assertThat((List<?>) updated.get("steps")).hasSize(1);
        assertThat((List<?>) updated.get("events")).extracting("type").contains("approval.granted", "step.rerun");
    }
}

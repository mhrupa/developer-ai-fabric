package dev.aifabric.backend.run;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aifabric.backend.config.FabricProperties;
import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import dev.aifabric.backend.integrations.cloudwatch.CloudWatchFinding;
import dev.aifabric.backend.integrations.cloudwatch.CloudWatchLogClient;
import dev.aifabric.backend.integrations.jira.JiraIssue;
import dev.aifabric.backend.integrations.jira.JiraIssueClient;
import dev.aifabric.backend.integrations.kb.KbSearchResponse;
import dev.aifabric.backend.integrations.kb.KbSearchResult;
import dev.aifabric.backend.integrations.kb.KnowledgeBaseClient;
import dev.aifabric.backend.integrations.repository.RepositoryContext;
import dev.aifabric.backend.integrations.repository.RepositoryContextClient;
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

        Map<String, Object> run = new WorkflowRunner(testStepRunner()).run(
                workflow,
                List.of(agent),
                Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod")
        );

        assertThat(run.get("status")).isEqualTo("completed");
        assertThat(run.get("runId").toString()).startsWith("BUG-1234-");
        assertThat((List<?>) run.get("steps")).hasSize(1);
        Map<?, ?> step = (Map<?, ?>) ((List<?>) run.get("steps")).getFirst();
        Map<?, ?> output = (Map<?, ?>) step.get("output");
        assertThat(output.get("source")).isEqualTo("test-jira");
        assertThat(output.get("summary")).isEqualTo("Checkout failures from test Jira");
        Map<?, ?> result = (Map<?, ?>) run.get("result");
        assertThat(result.get("confidence")).isEqualTo("low");
        assertThat(((Map<?, ?>) run.get("approval")).get("status")).isEqualTo("pending");
    }

    @Test
    void runsWorkflowByDependencies() {
        List<WorkflowStep> steps = List.of(
                new WorkflowStep("rca-writer", "rca-writer", List.of("kb-retriever", "log-analyzer")),
                new WorkflowStep("log-analyzer", "log-analyzer", List.of("bug-intake")),
                new WorkflowStep("bug-intake", "bug-intake", List.of()),
                new WorkflowStep("kb-retriever", "kb-retriever", List.of("bug-intake")),
                new WorkflowStep("code-analyzer", "code-analyzer", List.of("bug-intake"))
        );
        WorkflowDefinition workflow = new WorkflowDefinition(
                "fanout",
                "Fanout",
                "Dependency ordered workflow",
                Map.of(),
                steps,
                "fanout.workflow.yaml"
        );
        List<AgentDefinition> agents = steps.stream()
                .map(step -> new AgentDefinition(step.agent(), step.agent(), "", "1.0.0", Map.of(), List.of(), List.of(), step.agent() + ".agent.yaml"))
                .toList();

        Map<String, Object> run = new WorkflowRunner(testStepRunner()).run(
                workflow,
                agents,
                Map.of("jiraIssueKey", "BUG-1234", "service", "payment-api", "environment", "prod")
        );

        assertThat((List<?>) run.get("steps"))
                .extracting("id")
                .containsExactly("bug-intake", "log-analyzer", "kb-retriever", "code-analyzer", "rca-writer");
        Map<?, ?> logStep = (Map<?, ?>) ((List<?>) run.get("steps")).get(1);
        Map<?, ?> logOutput = (Map<?, ?>) logStep.get("output");
        assertThat(logOutput.get("source")).isEqualTo("test-cloudwatch");
        assertThat(logOutput.get("logGroup")).isEqualTo("/aws/ecs/payment-api");
        Map<?, ?> kbStep = (Map<?, ?>) ((List<?>) run.get("steps")).get(2);
        Map<?, ?> kbOutput = (Map<?, ?>) kbStep.get("output");
        assertThat(kbOutput.get("source")).isEqualTo("test-kb");
        Map<?, ?> result = (Map<?, ?>) run.get("result");
        assertThat((List<?>) result.get("similarIncidents")).hasSize(1);
        assertThat(result.get("runbooks")).asList().contains("payment-api production triage runbook");
        assertThat(result.get("knownErrors")).asList().contains("Known timeout issue");
        assertThat(result.get("impactedFiles")).asList().contains("backend/src/main/java/dev/aifabric/backend/run/WorkflowRunner.java");
        assertThat(result.get("testSuggestions")).asList().contains("Run backend adapter tests.");
        assertThat((List<?>) result.get("recentChanges")).hasSize(1);
    }

    @Test
    void persistsApprovalAndRerunStep() throws Exception {
        RunStore runStore = new RunStore(new FabricProperties(tempDir, tempDir.resolve("runs"), "", "", "", "", "", "", ""));
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
        WorkflowRunner runner = new WorkflowRunner(testStepRunner());
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

    private static JiraIssueClient fakeJiraIssueClient() {
        return (issueKey, input) -> new JiraIssue(
                issueKey,
                "Checkout failures from test Jira",
                "Synthetic Jira issue for tests.",
                "high",
                "open",
                List.of("service:payment-api"),
                List.of("payment-api"),
                List.of("payment-api"),
                "test-jira",
                Map.of()
        );
    }

    private static CloudWatchLogClient fakeCloudWatchLogClient() {
        return input -> new CloudWatchFinding(
                "test-cloudwatch",
                "/aws/ecs/payment-api",
                "us-east-1",
                List.of("checkout timeout"),
                List.of(),
                List.of(Map.of("metric", "latency", "finding", "p95 increased", "confidence", "medium")),
                List.of(Map.of("source", "cloudwatch", "summary", "Test CloudWatch evidence.", "confidence", "medium")),
                List.of()
        );
    }

    private static KnowledgeBaseClient fakeKnowledgeBaseClient() {
        return (query, input) -> new KbSearchResponse(
                "test-kb",
                query,
                List.of(new KbSearchResult(
                        "RCA-1024",
                        "Prior payment-api timeout",
                        "test-kb",
                        "Prior incident with similar checkout timeout.",
                        "incident",
                        "high",
                        Map.of("service", "payment-api")
                )),
                List.of("payment-api production triage runbook"),
                List.of("Known timeout issue"),
                List.of("Check prior dependency outage.")
        );
    }

    private static RepositoryContextClient fakeRepositoryContextClient() {
        return input -> new RepositoryContext(
                "test-repo",
                "org/payment-api",
                "main",
                List.of(Map.of(
                        "hash", "abc123",
                        "author", "Test Author",
                        "age", "1 hour ago",
                        "message", "Adjust checkout timeout handling"
                )),
                List.of("backend/src/main/java/dev/aifabric/backend/run/WorkflowRunner.java"),
                List.of("Run backend adapter tests."),
                List.of(Map.of("source", "local-repo", "summary", "Test repo evidence.", "confidence", "medium")),
                List.of()
        );
    }

    private static MockStepRunner testStepRunner() {
        return new MockStepRunner(
                fakeJiraIssueClient(),
                fakeCloudWatchLogClient(),
                fakeKnowledgeBaseClient(),
                fakeRepositoryContextClient()
        );
    }
}

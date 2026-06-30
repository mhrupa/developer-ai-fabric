package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class MockStepRunner implements StepRunner {

    private final JiraIssueClient jiraIssueClient;
    private final CloudWatchLogClient cloudWatchLogClient;
    private final KnowledgeBaseClient knowledgeBaseClient;
    private final RepositoryContextClient repositoryContextClient;

    public MockStepRunner(
            JiraIssueClient jiraIssueClient,
            CloudWatchLogClient cloudWatchLogClient,
            KnowledgeBaseClient knowledgeBaseClient,
            RepositoryContextClient repositoryContextClient
    ) {
        this.jiraIssueClient = jiraIssueClient;
        this.cloudWatchLogClient = cloudWatchLogClient;
        this.knowledgeBaseClient = knowledgeBaseClient;
        this.repositoryContextClient = repositoryContextClient;
    }

    @Override
    public Map<String, Object> execute(WorkflowStep step, AgentDefinition agent, Map<String, Object> input) {
        String service = stringValue(input.getOrDefault("service", "unknown-service"));
        String issueKey = stringValue(input.getOrDefault("jiraIssueKey", "UNKNOWN"));
        String environment = stringValue(input.getOrDefault("environment", "unknown"));

        return switch (step.agent()) {
            case "bug-intake" -> bugIntake(issueKey, input);
            case "service-resolver" -> mapOf(
                    "service", service,
                    "environment", environment,
                    "repository", "org/" + service,
                    "owners", List.of("service-owner-team"),
                    "logGroups", List.of("/aws/ecs/" + service)
            );
            case "kb-retriever" -> kbRetrieval(input);
            case "evidence-collector" -> mapOf("evidence", List.of(
                    mapOf("source", "jira", "summary", "Collected Jira context for " + issueKey + ".", "confidence", "medium"),
                    mapOf("source", "github", "summary", "Mock recent deployment context for " + service + ".", "confidence", "low")
            ));
            case "log-analyzer" -> logAnalysis(input);
            case "code-analyzer" -> codeAnalysis(input);
            case "rca-writer" -> mapOf(
                    "summary", "Mock RCA generated for " + issueKey + ".",
                    "suspectedRootCause", "Insufficient live integrations in this first slice; RCA is a placeholder.",
                    "confidence", "low"
            );
            case "reviewer" -> mapOf(
                    "readiness", "needs-real-evidence",
                    "weakAssumptions", List.of("Jira, KB, CloudWatch, and GitHub integrations are mocked.")
            );
            default -> mapOf("summary", (agent == null ? step.agent() : agent.name()) + " completed.");
        };
    }

    private Map<String, Object> codeAnalysis(Map<String, Object> input) {
        RepositoryContext context = repositoryContextClient.inspect(input);
        return mapOf(
                "source", context.source(),
                "repository", context.repository(),
                "branch", context.branch(),
                "recentChanges", context.recentChanges(),
                "impactedFiles", context.impactedFiles(),
                "testSuggestions", context.testSuggestions(),
                "evidence", context.evidence(),
                "openQuestions", context.openQuestions()
        );
    }

    private Map<String, Object> kbRetrieval(Map<String, Object> input) {
        String query = stringValue(input.getOrDefault("jiraIssueKey", "UNKNOWN")) + " "
                + stringValue(input.getOrDefault("service", "unknown-service")) + " customer bug RCA";
        KbSearchResponse response = knowledgeBaseClient.search(query, input);
        return mapOf(
                "source", response.source(),
                "query", response.query(),
                "similarIncidents", response.results().stream().map(MockStepRunner::kbResultMap).toList(),
                "runbooks", response.runbooks(),
                "knownErrors", response.knownErrors(),
                "openQuestions", response.openQuestions()
        );
    }

    private static Map<String, Object> kbResultMap(KbSearchResult result) {
        return mapOf(
                "id", result.id(),
                "title", result.title(),
                "source", result.source(),
                "summary", result.summary(),
                "type", result.type(),
                "confidence", result.confidence(),
                "metadata", result.metadata()
        );
    }

    private Map<String, Object> logAnalysis(Map<String, Object> input) {
        CloudWatchFinding finding = cloudWatchLogClient.searchLogs(input);
        return mapOf(
                "source", finding.source(),
                "logGroup", finding.logGroup(),
                "region", finding.region(),
                "errorPatterns", finding.errorPatterns(),
                "stackTraces", finding.stackTraces(),
                "metricFindings", finding.metricFindings(),
                "evidence", finding.evidence(),
                "openQuestions", finding.openQuestions()
        );
    }

    private Map<String, Object> bugIntake(String issueKey, Map<String, Object> input) {
        JiraIssue issue = jiraIssueClient.fetchIssue(issueKey, input);
        return mapOf(
                "issueKey", issue.key(),
                "summary", issue.summary(),
                "description", issue.description(),
                "severity", issue.severity(),
                "status", issue.status(),
                "labels", issue.labels(),
                "components", issue.components(),
                "serviceHints", issue.serviceHints(),
                "timeWindowHours", input.getOrDefault("timeWindowHours", 4),
                "source", issue.source()
        );
    }

    private static String stringValue(Object value) {
        return Objects.toString(value, "");
    }

    private static Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < entries.length; index += 2) {
            map.put(String.valueOf(entries[index]), entries[index + 1]);
        }
        return map;
    }
}

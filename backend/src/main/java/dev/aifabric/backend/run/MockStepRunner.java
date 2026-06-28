package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class MockStepRunner implements StepRunner {

    @Override
    public Map<String, Object> execute(WorkflowStep step, AgentDefinition agent, Map<String, Object> input) {
        String service = stringValue(input.getOrDefault("service", "unknown-service"));
        String issueKey = stringValue(input.getOrDefault("jiraIssueKey", "UNKNOWN"));
        String environment = stringValue(input.getOrDefault("environment", "unknown"));

        return switch (step.agent()) {
            case "bug-intake" -> mapOf(
                    "summary", issueKey + " normalized for RCA analysis.",
                    "severity", "unknown",
                    "serviceHints", List.of(service),
                    "timeWindowHours", input.getOrDefault("timeWindowHours", 4)
            );
            case "service-resolver" -> mapOf(
                    "service", service,
                    "environment", environment,
                    "repository", "org/" + service,
                    "owners", List.of("service-owner-team"),
                    "logGroups", List.of("/aws/ecs/" + service)
            );
            case "kb-retriever" -> mapOf(
                    "similarIncidents", List.of(mapOf(
                            "id", "RCA-1024",
                            "title", "Prior " + service + " customer-impacting timeout",
                            "confidence", "medium"
                    )),
                    "runbooks", List.of(service + " production triage runbook")
            );
            case "evidence-collector" -> mapOf("evidence", List.of(
                    mapOf("source", "jira", "summary", "Collected Jira context for " + issueKey + ".", "confidence", "medium"),
                    mapOf("source", "github", "summary", "Mock recent deployment context for " + service + ".", "confidence", "low")
            ));
            case "log-analyzer" -> mapOf(
                    "errorPatterns", List.of("5xx spike placeholder", "timeout placeholder"),
                    "evidence", List.of(mapOf(
                            "source", "cloudwatch",
                            "summary", "Mock CloudWatch scan for /aws/ecs/" + service + " in " + environment + ".",
                            "confidence", "low"
                    ))
            );
            case "code-analyzer" -> mapOf(
                    "impactedFiles", List.of("src/main", "config"),
                    "recentChanges", List.of("Mock recent commit touching request handling."),
                    "testSuggestions", List.of("Add regression coverage for timeout and dependency failure paths.")
            );
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

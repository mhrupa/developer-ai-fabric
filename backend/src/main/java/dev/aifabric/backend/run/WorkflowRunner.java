package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class WorkflowRunner {

    public Map<String, Object> run(WorkflowDefinition workflow, List<AgentDefinition> agents, Map<String, Object> input) {
        String issueKey = normalizeIdPart(stringValue(input.getOrDefault("jiraIssueKey", "LOCAL")));
        String runId = issueKey + "-" + System.currentTimeMillis();
        Instant createdAt = Instant.now();
        Map<String, AgentDefinition> agentById = agents.stream()
                .filter(agent -> agent.id() != null)
                .collect(Collectors.toMap(AgentDefinition::id, Function.identity()));

        List<Map<String, Object>> steps = new ArrayList<>();
        List<Map<String, Object>> events = new ArrayList<>();
        events.add(event("run.started", runId, Map.of(
                "workflow", workflow.id(),
                "message", "Started " + workflow.name()
        )));

        for (WorkflowStep step : workflow.steps()) {
            AgentDefinition agent = agentById.get(step.agent());
            events.add(event("step.started", runId, Map.of("stepId", step.id(), "agent", step.agent())));

            Map<String, Object> output = mockAgentOutput(step, agent, input);
            Map<String, Object> stepResult = new LinkedHashMap<>();
            stepResult.put("id", step.id());
            stepResult.put("agent", step.agent());
            stepResult.put("agentName", agent == null ? step.agent() : agent.name());
            stepResult.put("status", "completed");
            stepResult.put("startedAt", Instant.now().toString());
            stepResult.put("completedAt", Instant.now().toString());
            stepResult.put("output", output);
            steps.add(stepResult);

            for (Map<String, Object> evidence : evidenceFrom(output)) {
                events.add(event("evidence.found", runId, evidence));
            }
            events.add(event("step.completed", runId, Map.of("stepId", step.id(), "agent", step.agent())));
        }

        Map<String, Object> run = new LinkedHashMap<>();
        run.put("runId", runId);
        run.put("workflow", workflow.id());
        run.put("workflowName", workflow.name());
        run.put("status", "completed");
        run.put("input", input);
        run.put("createdAt", createdAt.toString());
        run.put("completedAt", Instant.now().toString());
        run.put("steps", steps);
        run.put("events", events);
        run.put("result", buildRcaResult(input, steps));

        events.add(event("approval.required", runId, Map.of("action", "post-to-jira")));
        events.add(event("run.completed", runId, Map.of("workflow", workflow.id())));
        return run;
    }

    private Map<String, Object> mockAgentOutput(WorkflowStep step, AgentDefinition agent, Map<String, Object> input) {
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

    private Map<String, Object> buildRcaResult(Map<String, Object> input, List<Map<String, Object>> steps) {
        List<Map<String, Object>> evidence = steps.stream()
                .map(step -> mapValue(step.get("output")).get("evidence"))
                .flatMap(value -> evidenceFromValue(value).stream())
                .toList();

        return mapOf(
                "issueKey", input.getOrDefault("jiraIssueKey", "UNKNOWN"),
                "service", input.getOrDefault("service", "unknown-service"),
                "environment", input.getOrDefault("environment", "unknown"),
                "summary", "Mock RCA workflow completed using local Spring Boot orchestration.",
                "suspectedRootCause", "Real root cause is not determined yet because external MCP and KB integrations are mocked in this slice.",
                "confidence", "low",
                "evidence", evidence,
                "mitigation", List.of(
                        "Wire Jira MCP, remote KB, CloudWatch MCP, and GitHub context before using RCA output operationally.",
                        "Keep Jira posting behind explicit approval."
                ),
                "openQuestions", List.of(
                        "What is the real Jira payload?",
                        "Which CloudWatch log groups should be searched?",
                        "Which deployment or commit changed near the incident window?"
                ),
                "checkedSources", mapOf(
                        "jira", false,
                        "kb", false,
                        "cloudwatch", false,
                        "github", false,
                        "localRepo", true
                )
        );
    }

    private Map<String, Object> event(String type, String runId, Map<String, Object> payload) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", type + "-" + UUID.randomUUID());
        event.put("type", type);
        event.put("runId", runId);
        event.put("createdAt", Instant.now().toString());
        event.putAll(payload);
        return event;
    }

    private List<Map<String, Object>> evidenceFrom(Map<String, Object> output) {
        return evidenceFromValue(output.get("evidence"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> evidenceFromValue(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static String stringValue(Object value) {
        return Objects.toString(value, "");
    }

    private static String normalizeIdPart(String value) {
        return value.replaceAll("[^a-zA-Z0-9-]", "-");
    }

    private static Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < entries.length; index += 2) {
            map.put(String.valueOf(entries[index]), entries[index + 1]);
        }
        return map;
    }
}

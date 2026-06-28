package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class WorkflowRunner {

    private final StepRunner stepRunner;

    public WorkflowRunner(StepRunner stepRunner) {
        this.stepRunner = stepRunner;
    }

    public Map<String, Object> run(WorkflowDefinition workflow, List<AgentDefinition> agents, Map<String, Object> input) {
        String issueKey = normalizeIdPart(stringValue(input.getOrDefault("jiraIssueKey", "LOCAL")));
        String runId = issueKey + "-" + System.currentTimeMillis();
        Map<String, AgentDefinition> agentById = agents.stream()
                .filter(agent -> agent.id() != null)
                .collect(Collectors.toMap(AgentDefinition::id, Function.identity()));

        RunState runState = new RunState(runId, workflow.id(), workflow.name(), input);
        runState.addEvent("run.started", Map.of(
                "workflow", workflow.id(),
                "message", "Started " + workflow.name()
        ));

        for (WorkflowStep step : workflow.steps()) {
            runState.addEvent("step.started", Map.of("stepId", step.id(), "agent", step.agent()));
            StepExecution execution = runStep(step, agentById.get(step.agent()), input);
            runState.addStep(execution);

            for (Map<String, Object> evidence : evidenceFrom(execution.output())) {
                runState.addEvent("evidence.found", evidence);
            }
            runState.addEvent("step.completed", Map.of("stepId", step.id(), "agent", step.agent()));
        }

        runState.addEvent("approval.required", Map.of("action", "post-to-jira"));
        runState.addEvent("run.completed", Map.of("workflow", workflow.id()));
        Map<String, Object> run = runState.complete(buildRcaResult(input, runState.steps()));
        run.put("approval", mapOf(
                "status", "pending",
                "requiredFor", List.of("post-to-jira"),
                "reason", "Guardrail requires explicit human approval before side effects"
        ));
        return run;
    }

    public StepExecution runStep(WorkflowStep step, AgentDefinition agent, Map<String, Object> input) {
        Instant startedAt = Instant.now();
        Map<String, Object> output = stepRunner.execute(step, agent, input);
        return new StepExecution(
                step.id(),
                step.agent(),
                agent == null ? step.agent() : agent.name(),
                "completed",
                startedAt.toString(),
                Instant.now().toString(),
                output
        );
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

package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Queue;
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

        for (WorkflowStep step : executionOrder(workflow.steps())) {
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

    private List<WorkflowStep> executionOrder(List<WorkflowStep> steps) {
        Map<String, WorkflowStep> stepById = steps.stream()
                .collect(Collectors.toMap(WorkflowStep::id, Function.identity(), (left, right) -> left, LinkedHashMap::new));
        Map<String, Integer> indegree = new LinkedHashMap<>();
        Map<String, List<String>> childrenByDependency = new HashMap<>();
        for (WorkflowStep step : steps) {
            indegree.put(step.id(), 0);
        }
        for (WorkflowStep step : steps) {
            for (String dependency : step.dependsOn() == null ? List.<String>of() : step.dependsOn()) {
                if (!stepById.containsKey(dependency)) {
                    continue;
                }
                indegree.put(step.id(), indegree.get(step.id()) + 1);
                childrenByDependency.computeIfAbsent(dependency, ignored -> new ArrayList<>()).add(step.id());
            }
        }

        Queue<String> ready = new ArrayDeque<>();
        indegree.forEach((stepId, count) -> {
            if (count == 0) {
                ready.add(stepId);
            }
        });

        List<WorkflowStep> ordered = new ArrayList<>();
        while (!ready.isEmpty()) {
            String stepId = ready.remove();
            ordered.add(stepById.get(stepId));
            for (String child : childrenByDependency.getOrDefault(stepId, List.of())) {
                int nextCount = indegree.get(child) - 1;
                indegree.put(child, nextCount);
                if (nextCount == 0) {
                    ready.add(child);
                }
            }
        }

        if (ordered.size() != steps.size()) {
            throw new IllegalArgumentException("Workflow dependency graph contains a cycle");
        }
        return ordered;
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
                executionContract(step, agent),
                output
        );
    }

    private Map<String, Object> executionContract(WorkflowStep step, AgentDefinition agent) {
        return mapOf(
                "stepId", step.id(),
                "agentId", step.agent(),
                "inputFields", List.of("jiraIssueKey", "service", "environment", "timeWindowHours"),
                "dependsOn", step.dependsOn() == null ? List.of() : step.dependsOn(),
                "tools", agent == null || agent.tools() == null ? List.of() : agent.tools(),
                "outputs", agent == null || agent.outputs() == null ? List.of("summary") : agent.outputs(),
                "modelPolicy", agent == null || agent.modelPolicy() == null ? Map.of() : agent.modelPolicy(),
                "timeoutSeconds", 120,
                "maxRetries", 1,
                "sideEffects", false,
                "approvalRequired", false
        );
    }

    private Map<String, Object> buildRcaResult(Map<String, Object> input, List<Map<String, Object>> steps) {
        List<Map<String, Object>> evidence = steps.stream()
                .map(step -> mapValue(step.get("output")).get("evidence"))
                .flatMap(value -> evidenceFromValue(value).stream())
                .toList();
        List<Map<String, Object>> similarIncidents = mapListFromStepOutputs(steps, "similarIncidents");
        List<Map<String, Object>> recentChanges = mapListFromStepOutputs(steps, "recentChanges");
        List<Object> runbooks = listFromStepOutputs(steps, "runbooks");
        List<Object> knownErrors = listFromStepOutputs(steps, "knownErrors");
        List<Object> impactedFiles = listFromStepOutputs(steps, "impactedFiles");
        List<Object> testSuggestions = listFromStepOutputs(steps, "testSuggestions");
        List<Object> openQuestions = new ArrayList<>();
        openQuestions.addAll(listFromStepOutputs(steps, "openQuestions"));
        openQuestions.add("What is the real Jira payload?");
        openQuestions.add("Which deployment or commit changed near the incident window?");

        return mapOf(
                "issueKey", input.getOrDefault("jiraIssueKey", "UNKNOWN"),
                "service", input.getOrDefault("service", "unknown-service"),
                "environment", input.getOrDefault("environment", "unknown"),
                "summary", "Mock RCA workflow completed using local Spring Boot orchestration.",
                "suspectedRootCause", "Real root cause is not determined yet because external MCP and KB integrations are mocked in this slice.",
                "confidence", "low",
                "evidence", evidence,
                "similarIncidents", similarIncidents,
                "runbooks", runbooks,
                "knownErrors", knownErrors,
                "recentChanges", recentChanges,
                "impactedFiles", impactedFiles,
                "testSuggestions", testSuggestions,
                "mitigation", List.of(
                        "Wire Jira MCP, remote KB/vector store, CloudWatch MCP, and GitHub context before using RCA output operationally.",
                        "Keep Jira posting behind explicit approval."
                ),
                "openQuestions", openQuestions.stream().distinct().toList(),
                "checkedSources", mapOf(
                        "jira", false,
                        "kb", !similarIncidents.isEmpty() || !runbooks.isEmpty() || !knownErrors.isEmpty(),
                        "cloudwatch", false,
                        "github", false,
                        "localRepo", !recentChanges.isEmpty() || !impactedFiles.isEmpty()
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

    private static List<Map<String, Object>> mapListFromStepOutputs(List<Map<String, Object>> steps, String field) {
        return steps.stream()
                .map(step -> mapValue(step.get("output")).get(field))
                .flatMap(value -> evidenceFromStaticValue(value).stream())
                .toList();
    }

    private static List<Object> listFromStepOutputs(List<Map<String, Object>> steps, String field) {
        return steps.stream()
                .map(step -> mapValue(step.get("output")).get(field))
                .flatMap(value -> objectList(value).stream())
                .toList();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> evidenceFromStaticValue(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    private static List<Object> objectList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
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

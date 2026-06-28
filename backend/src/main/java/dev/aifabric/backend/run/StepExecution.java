package dev.aifabric.backend.run;

import java.util.Map;

public record StepExecution(
        String id,
        String agent,
        String agentName,
        String status,
        String startedAt,
        String completedAt,
        Map<String, Object> output
) {
}

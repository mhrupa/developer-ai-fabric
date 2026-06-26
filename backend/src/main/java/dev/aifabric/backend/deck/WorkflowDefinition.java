package dev.aifabric.backend.deck;

import java.util.List;
import java.util.Map;

public record WorkflowDefinition(
        String id,
        String name,
        String description,
        Map<String, Object> orchestration,
        List<WorkflowStep> steps,
        String file
) {
}

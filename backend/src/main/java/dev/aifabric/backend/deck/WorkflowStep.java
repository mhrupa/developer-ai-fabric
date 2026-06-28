package dev.aifabric.backend.deck;

import java.util.List;

public record WorkflowStep(String id, String agent, List<String> dependsOn) {
}

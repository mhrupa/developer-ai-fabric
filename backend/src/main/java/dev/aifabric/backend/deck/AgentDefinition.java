package dev.aifabric.backend.deck;

import java.util.List;
import java.util.Map;

public record AgentDefinition(
        String id,
        String name,
        String description,
        String version,
        Map<String, Object> modelPolicy,
        List<String> tools,
        List<String> outputs,
        String file
) {
}

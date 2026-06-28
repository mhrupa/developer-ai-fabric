package dev.aifabric.backend.deck;

import java.util.List;

public record SkillDefinition(
        String id,
        String name,
        String description,
        String toolBinding,
        List<String> outputs,
        String file
) {
}

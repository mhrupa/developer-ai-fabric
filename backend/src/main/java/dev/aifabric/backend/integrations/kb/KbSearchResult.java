package dev.aifabric.backend.integrations.kb;

import java.util.Map;

public record KbSearchResult(
        String id,
        String title,
        String source,
        String summary,
        String type,
        String confidence,
        Map<String, Object> metadata
) {
}

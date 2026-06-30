package dev.aifabric.backend.integrations.repository;

import java.util.List;
import java.util.Map;

public record RepositoryContext(
        String source,
        String repository,
        String branch,
        List<Map<String, Object>> recentChanges,
        List<String> impactedFiles,
        List<String> testSuggestions,
        List<Map<String, Object>> evidence,
        List<String> openQuestions
) {
}

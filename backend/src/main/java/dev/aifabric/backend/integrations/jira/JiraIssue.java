package dev.aifabric.backend.integrations.jira;

import java.util.List;
import java.util.Map;

public record JiraIssue(
        String key,
        String summary,
        String description,
        String severity,
        String status,
        List<String> labels,
        List<String> components,
        List<String> serviceHints,
        String source,
        Map<String, Object> raw
) {
}

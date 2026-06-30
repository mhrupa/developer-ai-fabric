package dev.aifabric.backend.integrations.cloudwatch;

import java.util.List;
import java.util.Map;

public record CloudWatchFinding(
        String source,
        String logGroup,
        String region,
        List<String> errorPatterns,
        List<Map<String, Object>> stackTraces,
        List<Map<String, Object>> metricFindings,
        List<Map<String, Object>> evidence,
        List<String> openQuestions
) {
}

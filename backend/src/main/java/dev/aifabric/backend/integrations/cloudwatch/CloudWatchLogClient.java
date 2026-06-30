package dev.aifabric.backend.integrations.cloudwatch;

import java.util.Map;

public interface CloudWatchLogClient {
    CloudWatchFinding searchLogs(Map<String, Object> input);
}

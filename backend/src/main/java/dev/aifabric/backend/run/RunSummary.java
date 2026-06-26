package dev.aifabric.backend.run;

import java.time.Instant;

public record RunSummary(
        String runId,
        String workflow,
        String status,
        String issueKey,
        String service,
        Instant createdAt
) {
}

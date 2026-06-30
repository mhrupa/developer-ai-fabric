package dev.aifabric.backend.config;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "developer-ai-fabric")
public record FabricProperties(
        Path workspaceRoot,
        Path runStoreDir,
        String jiraBaseUrl,
        String jiraEmail,
        String jiraApiToken,
        String cloudWatchRegion,
        String cloudWatchLogGroup,
        String kbBaseUrl,
        String kbApiKey
) {
}

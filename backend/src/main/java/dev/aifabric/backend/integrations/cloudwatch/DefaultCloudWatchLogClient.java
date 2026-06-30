package dev.aifabric.backend.integrations.cloudwatch;

import dev.aifabric.backend.config.FabricProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class DefaultCloudWatchLogClient implements CloudWatchLogClient {

    private final FabricProperties properties;

    public DefaultCloudWatchLogClient(FabricProperties properties) {
        this.properties = properties;
    }

    @Override
    public CloudWatchFinding searchLogs(Map<String, Object> input) {
        String service = stringValue(input.getOrDefault("service", "unknown-service"));
        String environment = stringValue(input.getOrDefault("environment", "unknown"));
        String region = configured(properties.cloudWatchRegion()) ? properties.cloudWatchRegion() : stringValue(input.getOrDefault("region", "unknown-region"));
        String logGroup = configured(properties.cloudWatchLogGroup())
                ? properties.cloudWatchLogGroup()
                : stringValue(input.getOrDefault("logGroup", "/aws/ecs/" + service));
        String source = configured(properties.cloudWatchRegion()) && configured(properties.cloudWatchLogGroup())
                ? "cloudwatch-configured"
                : "local-cloudwatch-fallback";

        return new CloudWatchFinding(
                source,
                logGroup,
                region,
                List.of("5xx spike placeholder", "timeout placeholder"),
                List.of(),
                List.of(mapOf(
                        "metric", "HTTPCode_Target_5XX_Count",
                        "finding", "Placeholder metric finding for " + service + " in " + environment + ".",
                        "confidence", "low"
                )),
                List.of(mapOf(
                        "source", "cloudwatch",
                        "summary", "Read-only CloudWatch scan target " + logGroup + " in " + region + " for " + environment + ".",
                        "confidence", configured(properties.cloudWatchLogGroup()) ? "medium" : "low"
                )),
                List.of("Wire AWS CloudWatch MCP or AWS SDK query execution for real log events.")
        );
    }

    private static boolean configured(String value) {
        return value != null && !value.isBlank();
    }

    private static String stringValue(Object value) {
        return Objects.toString(value, "");
    }

    private static Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < entries.length; index += 2) {
            map.put(String.valueOf(entries[index]), entries[index + 1]);
        }
        return map;
    }
}

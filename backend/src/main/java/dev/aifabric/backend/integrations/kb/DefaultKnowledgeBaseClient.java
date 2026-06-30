package dev.aifabric.backend.integrations.kb;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class DefaultKnowledgeBaseClient implements KnowledgeBaseClient {

    private final FabricProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public DefaultKnowledgeBaseClient(FabricProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public KbSearchResponse search(String query, Map<String, Object> input) {
        if (!configured(properties.kbBaseUrl())) {
            return fallback(query, input, "local-kb-fallback");
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of("query", query, "input", input));
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(properties.kbBaseUrl().replaceAll("/+$", "") + "/search"))
                    .timeout(Duration.ofSeconds(10))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            if (configured(properties.kbApiKey())) {
                builder.header("authorization", "Bearer " + properties.kbApiKey());
            }
            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return fallback(query, input, "kb-unavailable-" + response.statusCode());
            }
            return fromPayload(query, response.body());
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return fallback(query, input, "kb-error");
        }
    }

    private KbSearchResponse fromPayload(String query, String body) throws IOException {
        Map<String, Object> payload = objectMapper.readValue(body, Map.class);
        List<KbSearchResult> results = listValue(payload.get("results")).stream()
                .map(this::resultFromMap)
                .toList();
        return new KbSearchResponse(
                "remote-kb",
                stringValue(payload.getOrDefault("query", query)),
                results,
                stringList(payload.get("runbooks")),
                stringList(payload.get("knownErrors")),
                stringList(payload.get("openQuestions"))
        );
    }

    private KbSearchResponse fallback(String query, Map<String, Object> input, String source) {
        String service = stringValue(input.getOrDefault("service", "unknown-service"));
        KbSearchResult incident = new KbSearchResult(
                "RCA-1024",
                "Prior " + service + " customer-impacting timeout",
                source,
                "Placeholder prior incident until the shared KB/vector service is configured.",
                "incident",
                "medium",
                mapOf("service", service)
        );
        return new KbSearchResponse(
                source,
                query,
                List.of(incident),
                List.of(service + " production triage runbook"),
                List.of("Timeouts and upstream dependency failures have prior RCA coverage."),
                List.of("Connect DAF_KB_BASE_URL to retrieve real incident neighbors.")
        );
    }

    private KbSearchResult resultFromMap(Map<String, Object> item) {
        return new KbSearchResult(
                stringValue(item.get("id")),
                stringValue(item.get("title")),
                stringValue(item.getOrDefault("source", "remote-kb")),
                stringValue(item.get("summary")),
                stringValue(item.getOrDefault("type", "document")),
                stringValue(item.getOrDefault("confidence", "unknown")),
                mapValue(item.get("metadata"))
        );
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listValue(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    private static List<String> stringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(Objects::toString).filter(item -> !item.isBlank()).toList();
        }
        if (value instanceof String text && !text.isBlank()) {
            return List.of(text);
        }
        return List.of();
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

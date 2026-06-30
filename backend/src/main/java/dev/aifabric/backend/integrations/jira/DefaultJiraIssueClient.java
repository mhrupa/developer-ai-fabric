package dev.aifabric.backend.integrations.jira;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class DefaultJiraIssueClient implements JiraIssueClient {

    private final FabricProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public DefaultJiraIssueClient(FabricProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public JiraIssue fetchIssue(String issueKey, Map<String, Object> input) {
        if (!configured()) {
            return fallbackIssue(issueKey, input, "local-input");
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(issueUri(issueKey))
                    .timeout(Duration.ofSeconds(10))
                    .header("accept", "application/json")
                    .header("authorization", "Basic " + authToken())
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return fallbackIssue(issueKey, input, "jira-unavailable-" + response.statusCode());
            }
            return fromJiraPayload(issueKey, response.body());
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return fallbackIssue(issueKey, input, "jira-error");
        }
    }

    private boolean configured() {
        return present(properties.jiraBaseUrl()) && present(properties.jiraEmail()) && present(properties.jiraApiToken());
    }

    private URI issueUri(String issueKey) {
        String baseUrl = properties.jiraBaseUrl().replaceAll("/+$", "");
        String encodedKey = URLEncoder.encode(issueKey, StandardCharsets.UTF_8);
        String fields = "summary,description,priority,labels,components,status";
        return URI.create(baseUrl + "/rest/api/3/issue/" + encodedKey + "?fields=" + fields);
    }

    private String authToken() {
        String value = properties.jiraEmail() + ":" + properties.jiraApiToken();
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private JiraIssue fromJiraPayload(String fallbackKey, String body) throws IOException {
        Map<String, Object> payload = objectMapper.readValue(body, Map.class);
        Map<String, Object> fields = mapValue(payload.get("fields"));
        List<String> labels = stringList(fields.get("labels"));
        List<String> components = componentNames(fields.get("components"));
        String summary = stringValue(fields.get("summary"));
        return new JiraIssue(
                stringValue(payload.getOrDefault("key", fallbackKey)),
                summary,
                descriptionText(fields.get("description")),
                priorityName(fields.get("priority")),
                namedValue(fields.get("status")),
                labels,
                components,
                serviceHints(labels, components, summary),
                "jira-rest",
                payload
        );
    }

    private JiraIssue fallbackIssue(String issueKey, Map<String, Object> input, String source) {
        String service = stringValue(input.getOrDefault("service", "unknown-service"));
        String environment = stringValue(input.getOrDefault("environment", "unknown"));
        String summary = stringValue(input.getOrDefault("summary", issueKey + " reported against " + service + " in " + environment));
        return new JiraIssue(
                issueKey,
                summary,
                stringValue(input.getOrDefault("description", "")),
                stringValue(input.getOrDefault("severity", "unknown")),
                stringValue(input.getOrDefault("status", "unknown")),
                stringList(input.get("labels")),
                stringList(input.get("components")),
                List.of(service),
                source,
                Map.of("input", input)
        );
    }

    private static List<String> serviceHints(List<String> labels, List<String> components, String summary) {
        List<String> hints = new ArrayList<>();
        hints.addAll(components);
        labels.stream()
                .filter(label -> label.startsWith("service:") || label.startsWith("service-"))
                .map(label -> label.replaceFirst("^service[:-]", ""))
                .forEach(hints::add);
        if (hints.isEmpty() && summary != null && summary.contains("payment")) {
            hints.add("payment-api");
        }
        return hints.isEmpty() ? List.of("unknown-service") : hints.stream().distinct().toList();
    }

    private static String descriptionText(Object value) {
        if (value instanceof String text) {
            return text;
        }
        if (value instanceof Map<?, ?> || value instanceof List<?>) {
            return "Jira description is structured content.";
        }
        return "";
    }

    private static String priorityName(Object value) {
        String name = namedValue(value);
        return name == null || name.isBlank() ? "unknown" : name;
    }

    private static String namedValue(Object value) {
        return stringValue(mapValue(value).get("name"));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private static List<String> stringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(Objects::toString)
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        if (value instanceof String text && !text.isBlank()) {
            return Arrays.stream(text.split(",")).map(String::trim).filter(item -> !item.isBlank()).toList();
        }
        return List.of();
    }

    private static List<String> componentNames(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        List<String> components = new ArrayList<>();
        for (Object item : list) {
            String name = namedValue(item);
            if (name != null && !name.isBlank()) {
                components.add(name);
            }
        }
        return components;
    }

    private static boolean present(String value) {
        return value != null && !value.isBlank();
    }

    private static String stringValue(Object value) {
        return Objects.toString(value, "");
    }
}

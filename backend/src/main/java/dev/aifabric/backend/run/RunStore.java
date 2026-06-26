package dev.aifabric.backend.run;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RunStore {

    private final FabricProperties properties;
    private final ObjectMapper objectMapper;

    public RunStore(FabricProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public void save(Map<String, Object> run) throws IOException {
        Files.createDirectories(properties.runStoreDir());
        String runId = String.valueOf(run.get("runId"));
        objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(properties.runStoreDir().resolve(runId + ".json").toFile(), run);
    }

    public Optional<Map<String, Object>> get(String runId) throws IOException {
        Path path = properties.runStoreDir().resolve(runId + ".json");
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        return Optional.of(objectMapper.readValue(path.toFile(), Map.class));
    }

    public List<RunSummary> list() throws IOException {
        if (!Files.isDirectory(properties.runStoreDir())) {
            return List.of();
        }

        try (var paths = Files.list(properties.runStoreDir())) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .map(this::readSummary)
                    .sorted(Comparator.comparing(RunSummary::createdAt).reversed())
                    .toList();
        }
    }

    private RunSummary readSummary(Path path) {
        try {
            Map<String, Object> run = objectMapper.readValue(path.toFile(), Map.class);
            Map<String, Object> input = mapValue(run.get("input"));
            return new RunSummary(
                    stringValue(run.get("runId")),
                    stringValue(run.get("workflow")),
                    stringValue(run.get("status")),
                    stringValue(input.get("jiraIssueKey")),
                    stringValue(input.get("service")),
                    Instant.parse(stringValue(run.get("createdAt")))
            );
        } catch (IOException error) {
            throw new IllegalStateException("Failed to read run file: " + path, error);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}

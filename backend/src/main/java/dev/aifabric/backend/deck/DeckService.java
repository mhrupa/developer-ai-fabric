package dev.aifabric.backend.deck;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DeckService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final FabricProperties properties;
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    public DeckService(FabricProperties properties) {
        this.properties = properties;
    }

    public List<AgentDefinition> agents() throws IOException {
        Path agentsDir = properties.workspaceRoot().normalize().resolve(".agent-deck/agents");
        if (!Files.isDirectory(agentsDir)) {
            return List.of();
        }

        try (var paths = Files.list(agentsDir)) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".agent.yaml"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(this::readAgent)
                    .toList();
        }
    }

    public List<WorkflowDefinition> workflows() throws IOException {
        Path workflowsDir = properties.workspaceRoot().normalize().resolve(".agent-deck/workflows");
        if (!Files.isDirectory(workflowsDir)) {
            return List.of();
        }

        try (var paths = Files.list(workflowsDir)) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".workflow.yaml"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(this::readWorkflow)
                    .toList();
        }
    }

    private AgentDefinition readAgent(Path path) {
        Map<String, Object> raw = readYaml(path);
        return new AgentDefinition(
                stringValue(raw.get("id")),
                stringValue(raw.get("name")),
                stringValue(raw.get("description")),
                stringValue(raw.get("version")),
                mapValue(raw.get("modelPolicy")),
                stringList(raw.get("tools")),
                stringList(raw.get("outputs")),
                path.getFileName().toString()
        );
    }

    private WorkflowDefinition readWorkflow(Path path) {
        Map<String, Object> raw = readYaml(path);
        return new WorkflowDefinition(
                stringValue(raw.get("id")),
                stringValue(raw.get("name")),
                stringValue(raw.get("description")),
                mapValue(raw.get("orchestration")),
                workflowSteps(raw.get("steps")),
                path.getFileName().toString()
        );
    }

    private Map<String, Object> readYaml(Path path) {
        try {
            return yamlMapper.readValue(path.toFile(), MAP_TYPE);
        } catch (IOException error) {
            throw new IllegalStateException("Failed to read deck file: " + path, error);
        }
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static List<String> stringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private static List<WorkflowStep> workflowSteps(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }

        return list.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .map(item -> new WorkflowStep(stringValue(item.get("id")), stringValue(item.get("agent"))))
                .toList();
    }
}

package dev.aifabric.backend.deck;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    public List<SkillDefinition> skills() throws IOException {
        Path skillsDir = properties.workspaceRoot().normalize().resolve(".agent-deck/skills");
        if (!Files.isDirectory(skillsDir)) {
            return List.of();
        }

        try (var paths = Files.list(skillsDir)) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".skill.yaml"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(this::readSkill)
                    .toList();
        }
    }

    public List<KbSourceDefinition> kbSources() throws IOException {
        Path sourcesDir = properties.workspaceRoot().normalize().resolve(".agent-deck/kb/sources");
        if (!Files.isDirectory(sourcesDir)) {
            return List.of();
        }

        try (var paths = Files.list(sourcesDir)) {
            return paths
                    .filter(path -> path.getFileName().toString().endsWith(".kb-source.yaml"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .map(this::readKbSource)
                    .toList();
        }
    }

    public AgentDefinition saveAgent(AgentDefinition agent) throws IOException {
        requireId(agent.id(), "agent id");
        Map<String, Object> yaml = new LinkedHashMap<>();
        yaml.put("id", agent.id());
        yaml.put("name", agent.name());
        yaml.put("description", agent.description());
        yaml.put("version", agent.version() == null ? "1.0.0" : agent.version());
        yaml.put("modelPolicy", agent.modelPolicy() == null || agent.modelPolicy().isEmpty()
                ? Map.of("defaultTask", "general", "allowLocal", true, "allowCloud", true)
                : agent.modelPolicy());
        yaml.put("tools", agent.tools() == null ? List.of() : agent.tools());
        yaml.put("outputs", agent.outputs() == null ? List.of() : agent.outputs());

        Path file = deckFile(".agent-deck/agents", agent.id(), ".agent.yaml");
        writeYaml(file, yaml);
        return readAgent(file);
    }

    public SkillDefinition saveSkill(SkillDefinition skill) throws IOException {
        requireId(skill.id(), "skill id");
        Map<String, Object> yaml = new LinkedHashMap<>();
        yaml.put("id", skill.id());
        yaml.put("name", skill.name());
        yaml.put("description", skill.description());
        yaml.put("toolBinding", skill.toolBinding());
        yaml.put("outputs", skill.outputs() == null ? List.of() : skill.outputs());

        Path file = deckFile(".agent-deck/skills", skill.id(), ".skill.yaml");
        writeYaml(file, yaml);
        return readSkill(file);
    }

    public KbSourceDefinition saveKbSource(KbSourceDefinition source) throws IOException {
        requireId(source.id(), "kb source id");
        Map<String, Object> yaml = new LinkedHashMap<>();
        yaml.put("id", source.id());
        yaml.put("name", source.name());
        yaml.put("type", source.type());
        yaml.put("url", source.url());

        Path file = deckFile(".agent-deck/kb/sources", source.id(), ".kb-source.yaml");
        writeYaml(file, yaml);
        return readKbSource(file);
    }

    public WorkflowDefinition saveWorkflow(WorkflowDefinition workflow) throws IOException {
        requireId(workflow.id(), "workflow id");
        validateWorkflow(workflow, agents());
        Map<String, Object> yaml = new LinkedHashMap<>();
        yaml.put("id", workflow.id());
        yaml.put("name", workflow.name());
        yaml.put("description", workflow.description());
        yaml.put("orchestration", workflow.orchestration() == null || workflow.orchestration().isEmpty()
                ? Map.of(
                "mode", "deterministic-graph",
                "strategy", "sequential",
                "allowAgentDelegation", false,
                "requireApprovalForSideEffects", true
        )
                : workflow.orchestration());
        yaml.put("steps", workflow.steps() == null ? List.of() : workflow.steps());

        Path file = deckFile(".agent-deck/workflows", workflow.id(), ".workflow.yaml");
        writeYaml(file, yaml);
        return readWorkflow(file);
    }

    private void validateWorkflow(WorkflowDefinition workflow, List<AgentDefinition> agents) {
        if (workflow.steps() == null || workflow.steps().isEmpty()) {
            throw new IllegalArgumentException("Workflow must include at least one step");
        }

        Map<String, Object> orchestration = workflow.orchestration() == null ? Map.of() : workflow.orchestration();
        Object requireApproval = orchestration.get("requireApprovalForSideEffects");
        if (Boolean.FALSE.equals(requireApproval)) {
            throw new IllegalArgumentException("Guardrail violation: side-effect approval must remain enabled");
        }

        Set<String> agentIds = agents.stream().map(AgentDefinition::id).collect(java.util.stream.Collectors.toSet());
        Set<String> stepIds = new HashSet<>();
        for (WorkflowStep step : workflow.steps()) {
            requireId(step.id(), "workflow step id");
            requireId(step.agent(), "workflow step agent");
            if (!stepIds.add(step.id())) {
                throw new IllegalArgumentException("Duplicate workflow step id: " + step.id());
            }
            if (!agentIds.contains(step.agent())) {
                throw new IllegalArgumentException("Unknown workflow agent: " + step.agent());
            }
        }
        for (WorkflowStep step : workflow.steps()) {
            for (String dependency : step.dependsOn() == null ? List.<String>of() : step.dependsOn()) {
                if (!stepIds.contains(dependency)) {
                    throw new IllegalArgumentException("Unknown workflow dependency: " + dependency);
                }
                if (step.id().equals(dependency)) {
                    throw new IllegalArgumentException("Workflow step cannot depend on itself: " + step.id());
                }
            }
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

    private SkillDefinition readSkill(Path path) {
        Map<String, Object> raw = readYaml(path);
        return new SkillDefinition(
                stringValue(raw.get("id")),
                stringValue(raw.get("name")),
                stringValue(raw.get("description")),
                stringValue(raw.get("toolBinding")),
                stringList(raw.get("outputs")),
                path.getFileName().toString()
        );
    }

    private KbSourceDefinition readKbSource(Path path) {
        Map<String, Object> raw = readYaml(path);
        return new KbSourceDefinition(
                stringValue(raw.get("id")),
                stringValue(raw.get("name")),
                stringValue(raw.get("type")),
                stringValue(raw.get("url")),
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

    private void writeYaml(Path path, Map<String, Object> yaml) throws IOException {
        Files.createDirectories(path.getParent());
        yamlMapper.writeValue(path.toFile(), yaml);
    }

    private Path deckFile(String directory, String id, String suffix) {
        return properties.workspaceRoot().normalize()
                .resolve(directory)
                .resolve(safeFileId(id) + suffix);
    }

    private static void requireId(String id, String label) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Missing " + label);
        }
    }

    private static String safeFileId(String id) {
        return id.toLowerCase().replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-");
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
                .map(item -> new WorkflowStep(
                        stringValue(item.get("id")),
                        stringValue(item.get("agent")),
                        stringList(item.get("dependsOn"))
                ))
                .toList();
    }
}

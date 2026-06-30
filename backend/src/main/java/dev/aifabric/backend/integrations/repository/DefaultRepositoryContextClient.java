package dev.aifabric.backend.integrations.repository;

import dev.aifabric.backend.config.FabricProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class DefaultRepositoryContextClient implements RepositoryContextClient {

    private static final Duration GIT_TIMEOUT = Duration.ofSeconds(4);

    private final FabricProperties properties;

    public DefaultRepositoryContextClient(FabricProperties properties) {
        this.properties = properties;
    }

    @Override
    public RepositoryContext inspect(Map<String, Object> input) {
        Path repositoryPath = repositoryPath(input);
        String repository = stringValue(input.getOrDefault("repository", repositoryPath.toString()));
        if (!Files.isDirectory(repositoryPath.resolve(".git"))) {
            return fallback(repository, "local-repo-unavailable", repositoryPath);
        }

        String branch = git(repositoryPath, "rev-parse", "--abbrev-ref", "HEAD").trim();
        List<Map<String, Object>> recentChanges = recentChanges(repositoryPath);
        List<String> impactedFiles = impactedFiles(repositoryPath);
        return new RepositoryContext(
                "local-git",
                repository,
                branch.isBlank() ? "unknown" : branch,
                recentChanges,
                impactedFiles,
                testSuggestions(impactedFiles),
                List.of(mapOf(
                        "source", "local-repo",
                        "summary", "Inspected " + recentChanges.size() + " recent commits and " + impactedFiles.size() + " changed paths.",
                        "confidence", recentChanges.isEmpty() ? "low" : "medium"
                )),
                recentChanges.isEmpty() ? List.of("No local git history was available for repository analysis.") : List.of()
        );
    }

    private Path repositoryPath(Map<String, Object> input) {
        Object explicitPath = input.get("repositoryPath");
        if (explicitPath != null && !stringValue(explicitPath).isBlank()) {
            return Path.of(stringValue(explicitPath)).toAbsolutePath().normalize();
        }
        return properties.workspaceRoot().toAbsolutePath().normalize();
    }

    private List<Map<String, Object>> recentChanges(Path repositoryPath) {
        String output = git(repositoryPath, "log", "-5", "--pretty=format:%h%x09%an%x09%ar%x09%s");
        if (output.isBlank()) {
            return List.of();
        }
        List<Map<String, Object>> changes = new ArrayList<>();
        for (String line : output.split("\\R")) {
            String[] parts = line.split("\\t", 4);
            if (parts.length == 4) {
                changes.add(mapOf("hash", parts[0], "author", parts[1], "age", parts[2], "message", parts[3]));
            }
        }
        return changes;
    }

    private List<String> impactedFiles(Path repositoryPath) {
        String output = git(repositoryPath, "diff", "--name-only", "HEAD~5..HEAD");
        if (output.isBlank()) {
            output = git(repositoryPath, "ls-files");
        }
        return output.lines()
                .filter(line -> !line.isBlank())
                .filter(line -> line.startsWith("backend/") || line.startsWith("frontend/") || line.startsWith(".agent-deck/"))
                .limit(12)
                .toList();
    }

    private List<String> testSuggestions(List<String> impactedFiles) {
        List<String> suggestions = new ArrayList<>();
        if (impactedFiles.stream().anyMatch(path -> path.startsWith("backend/"))) {
            suggestions.add("Run backend unit tests for changed orchestration and adapter code.");
        }
        if (impactedFiles.stream().anyMatch(path -> path.startsWith("frontend/"))) {
            suggestions.add("Run frontend build and inspect execution detail rendering.");
        }
        if (impactedFiles.stream().anyMatch(path -> path.startsWith(".agent-deck/"))) {
            suggestions.add("Validate affected agent deck YAML before saving workflows.");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Add regression coverage around the code paths touched near the incident window.");
        }
        return suggestions;
    }

    private RepositoryContext fallback(String repository, String source, Path repositoryPath) {
        return new RepositoryContext(
                source,
                repository,
                "unknown",
                List.of(),
                List.of(),
                List.of("Configure repositoryPath or run from a Git workspace to enable local code analysis."),
                List.of(mapOf(
                        "source", "local-repo",
                        "summary", "Repository not available at " + repositoryPath + ".",
                        "confidence", "low"
                )),
                List.of("Which repository and branch should be inspected for this incident?")
        );
    }

    private String git(Path repositoryPath, String... args) {
        List<String> command = new ArrayList<>();
        command.add("git");
        command.addAll(List.of(args));
        ProcessBuilder processBuilder = new ProcessBuilder(command)
                .directory(repositoryPath.toFile())
                .redirectErrorStream(true);
        try {
            Process process = processBuilder.start();
            boolean finished = process.waitFor(GIT_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                return "";
            }
            if (process.exitValue() != 0) {
                return "";
            }
            return new String(process.getInputStream().readAllBytes());
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return "";
        }
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

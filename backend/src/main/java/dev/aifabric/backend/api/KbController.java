package dev.aifabric.backend.api;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kb")
public class KbController {

    @PostMapping("/search")
    public Map<String, Object> search(@RequestBody Map<String, Object> request) {
        return Map.of(
                "query", request.getOrDefault("query", ""),
                "results", List.of(Map.of(
                        "source", "mock-kb",
                        "title", "Remote KB client not configured yet",
                        "summary", "This placeholder proves the Spring Boot API contract before connecting the shared KB.",
                        "confidence", "low"
                ))
        );
    }
}

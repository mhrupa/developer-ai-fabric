package dev.aifabric.backend.api;

import dev.aifabric.backend.integrations.kb.KbSearchResponse;
import dev.aifabric.backend.integrations.kb.KbSearchResult;
import dev.aifabric.backend.integrations.kb.KnowledgeBaseClient;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kb")
public class KbController {

    private final KnowledgeBaseClient knowledgeBaseClient;

    public KbController(KnowledgeBaseClient knowledgeBaseClient) {
        this.knowledgeBaseClient = knowledgeBaseClient;
    }

    @PostMapping("/search")
    public Map<String, Object> search(@RequestBody Map<String, Object> request) {
        String query = String.valueOf(request.getOrDefault("query", ""));
        KbSearchResponse response = knowledgeBaseClient.search(query, request);
        return Map.of(
                "query", response.query(),
                "source", response.source(),
                "results", response.results().stream().map(KbController::resultMap).toList(),
                "runbooks", response.runbooks(),
                "knownErrors", response.knownErrors(),
                "openQuestions", response.openQuestions()
        );
    }

    private static Map<String, Object> resultMap(KbSearchResult result) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", result.id());
        map.put("title", result.title());
        map.put("source", result.source());
        map.put("summary", result.summary());
        map.put("type", result.type());
        map.put("confidence", result.confidence());
        map.put("metadata", result.metadata());
        return map;
    }
}

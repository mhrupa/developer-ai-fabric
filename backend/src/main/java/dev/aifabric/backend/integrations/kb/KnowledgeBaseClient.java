package dev.aifabric.backend.integrations.kb;

import java.util.Map;

public interface KnowledgeBaseClient {
    KbSearchResponse search(String query, Map<String, Object> input);
}

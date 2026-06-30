package dev.aifabric.backend.integrations.repository;

import java.util.Map;

public interface RepositoryContextClient {
    RepositoryContext inspect(Map<String, Object> input);
}

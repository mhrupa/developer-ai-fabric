package dev.aifabric.backend.deck;

public record KbSourceDefinition(
        String id,
        String name,
        String type,
        String url,
        String file
) {
}

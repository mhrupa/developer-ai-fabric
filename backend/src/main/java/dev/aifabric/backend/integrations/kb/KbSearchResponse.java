package dev.aifabric.backend.integrations.kb;

import java.util.List;

public record KbSearchResponse(
        String source,
        String query,
        List<KbSearchResult> results,
        List<String> runbooks,
        List<String> knownErrors,
        List<String> openQuestions
) {
}

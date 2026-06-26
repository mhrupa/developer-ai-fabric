package dev.aifabric.backend.api;

import dev.aifabric.backend.deck.DeckService;
import java.io.IOException;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class DeckController {

    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @GetMapping("/agents")
    public Map<String, Object> agents() throws IOException {
        return Map.of("agents", deckService.agents());
    }

    @GetMapping("/workflows")
    public Map<String, Object> workflows() throws IOException {
        return Map.of("workflows", deckService.workflows());
    }
}

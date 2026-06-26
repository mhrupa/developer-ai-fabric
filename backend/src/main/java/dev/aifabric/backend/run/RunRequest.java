package dev.aifabric.backend.run;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record RunRequest(
        @NotBlank String workflow,
        Map<String, Object> input
) {
}

package dev.aifabric.backend.run;

import dev.aifabric.backend.deck.AgentDefinition;
import dev.aifabric.backend.deck.WorkflowStep;
import java.util.Map;

public interface StepRunner {

    Map<String, Object> execute(WorkflowStep step, AgentDefinition agent, Map<String, Object> input);
}

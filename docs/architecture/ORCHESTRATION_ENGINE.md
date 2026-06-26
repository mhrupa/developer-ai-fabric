# Local Orchestration Engine

## Position

Developer AI Fabric should use a CrewAI-like multi-agent orchestration model, but it should not depend on CrewAI.

The orchestration engine should be product-owned, deterministic by default, inspectable in the UI, and designed around engineering evidence rather than open-ended autonomous delegation.

## Why Not CrewAI

Avoid making CrewAI the foundation because:

- the core workflow must be auditable and predictable
- every agent step needs typed inputs, outputs, evidence, and approval state
- local execution must integrate tightly with repo context, MCP tools, and the UI
- the platform should avoid framework lock-in
- side-effect boundaries must be enforced by our runtime, not by prompt convention

## Target Model

```text
Workflow Definition
  |
Planner
  |
Execution Graph
  |
Agent Step Runner
  |
Tool/MCP Gateway + KB Client + LLM Gateway
  |
Typed Step Output
  |
Reviewer / Approval Gate
```

## Core Concepts

### Workflow

A workflow defines the goal, input schema, agent steps, dependencies, approval gates, and final output contract.

Example:

```yaml
id: rca-analysis
name: RCA Analysis
orchestration:
  mode: deterministic-graph
  strategy: sequential
  allowAgentDelegation: false
  requireApprovalForSideEffects: true
steps:
  - id: bug-intake
    agent: bug-intake
  - id: service-resolver
    agent: service-resolver
    dependsOn:
      - bug-intake
  - id: kb-retriever
    agent: kb-retriever
    dependsOn:
      - service-resolver
```

### Agent Step

An agent step is a bounded unit of work.

It should have:

- agent id
- explicit input mapping
- allowed tools
- model policy
- timeout
- retry policy
- output schema
- evidence requirements

### Shared Run State

Agents should not pass unstructured conversation history as the primary state.

The engine should maintain typed run state:

```json
{
  "input": {},
  "serviceContext": {},
  "evidence": [],
  "stepOutputs": {},
  "decisions": [],
  "approvals": [],
  "finalResult": {}
}
```

### Evidence Ledger

Every evidence-producing step writes to an evidence ledger.

Evidence records should include:

- source
- reference
- time window
- summary
- confidence
- collected by agent
- created timestamp

### Approval Gates

The engine must pause or mark approval-required before side effects.

Approval-required actions:

- post Jira comment
- create PR
- push branch
- rollback deployment
- change config
- write to shared RCA store

## Execution Modes

### Deterministic Sequential

Runs steps in order. This is the MVP mode.

### Deterministic DAG

Runs steps based on `dependsOn`. Independent evidence collection steps can run in parallel later.

### Human-In-The-Loop

Pauses before selected steps or side effects.

### Iterative Review Loop

Allows bounded loops, for example:

```text
RCA Writer -> Reviewer -> RCA Writer
```

The loop must have a max iteration count and clear exit condition.

## Non-Goals

The MVP engine should not support:

- agents spawning arbitrary agents
- unrestricted tool access
- hidden autonomous planning
- unbounded loops
- automatic production side effects
- prompt-only permissions

## Engine Interfaces

Suggested internal interfaces:

```text
WorkflowLoader
AgentRegistry
RunStateStore
OrchestrationEngine
StepRunner
ToolGateway
LlmGateway
ApprovalService
EventPublisher
```

## UI Expectations

The UI should expose the engine behavior:

- graph view
- current step
- queued steps
- completed steps
- skipped steps
- failed steps
- evidence ledger
- approval gates
- rerun controls

The user should be able to understand what each agent did without reading raw prompts.

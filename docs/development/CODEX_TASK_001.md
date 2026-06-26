# Codex Task 001 - Bootstrap Local Developer AI Fabric Service

## Goal

Create the first working vertical slice of the local Developer AI Fabric service.

The result should prove that a repository-local agent deck can be loaded, displayed, and orchestrated through a local API and basic UI.

## Implement

1. Create the local service project.
2. Add `/api/v1/health`.
3. Add `/api/v1/agents`.
4. Add `/api/v1/workflows`.
5. Add `/api/v1/runs`.
6. Load agent metadata from `.agent-deck/agents`.
7. Load workflow metadata from `.agent-deck/workflows`.
8. Implement a simple local orchestration engine using mocked agent execution.
9. Persist local run history under `~/.developer-ai-fabric/runs`.
10. Add a basic local UI with:
    - dashboard
    - agent catalog
    - workflow list
    - run detail page
11. Add tests for agent loading, workflow loading, and run creation.

## Constraints

- Do not implement central unattended orchestration.
- Do not implement automatic production actions.
- Do not post to Jira without explicit approval.
- Do not call AWS, Jira, or GitHub directly from the UI.
- Keep external integrations behind service interfaces.
- Keep model provider access behind an LLM gateway abstraction.
- Use local mock agents for the first vertical slice.
- Do not adopt CrewAI or another agent orchestration framework for the MVP.
- Keep orchestration deterministic and visible through run steps/events.

## Sample Agent Metadata

```yaml
id: bug-intake
name: Bug Intake Agent
description: Extracts structured RCA input from a Jira bug
version: 1.0.0
tools:
  - jira-mcp
outputs:
  - issueSummary
  - severity
  - serviceHints
  - timeWindow
```

## Sample Workflow Metadata

```yaml
id: rca-analysis
name: RCA Analysis
description: Produces an evidence-backed RCA report for a Jira bug
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
  - id: kb-retriever
    agent: kb-retriever
  - id: rca-writer
    agent: rca-writer
```

## Expected Run Request

```json
{
  "workflow": "rca-analysis",
  "input": {
    "jiraIssueKey": "BUG-1234",
    "service": "payment-api",
    "environment": "prod",
    "timeWindowHours": 4
  }
}
```

## Expected Response Shape

```json
{
  "runId": "BUG-1234-run-001",
  "workflow": "rca-analysis",
  "status": "completed",
  "steps": [
    {
      "id": "bug-intake",
      "agent": "bug-intake",
      "status": "completed"
    }
  ],
  "result": {
    "summary": "Mock RCA summary",
    "confidence": "low",
    "evidence": [],
    "openQuestions": [
      "Real Jira, KB, CloudWatch, and repo integrations are not enabled yet."
    ]
  }
}
```

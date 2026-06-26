# Development Sequence

## Build Order

1. Local service skeleton
2. Health API
3. Agent deck file loader
4. Agent catalog API
5. Workflow catalog API
6. Local run state persistence
7. Workflow runner with mocked agents
8. Run events stream
9. Local UI dashboard
10. Agent catalog UI
11. Workflow orchestration UI
12. RCA run page
13. Remote KB client interface
14. Jira MCP integration
15. Bug Intake Agent
16. Service Resolver Agent
17. KB Retriever Agent
18. CloudWatch MCP integration
19. GitHub/Git integration
20. Evidence Collector Agent
21. Log Analyzer Agent
22. Code Analyzer Agent
23. RCA Writer Agent
24. Reviewer Agent
25. Manual Jira posting approval
26. VS Code extension wrapper

## Milestone 1

Implement the minimum vertical slice:

```text
Local UI / CLI
  |
Local Service
  |
Agent Deck Loader
  |
Workflow Runner
  |
Mock RCA Workflow
  |
Local Run History
```

## Milestone 1 Deliverables

- local service project
- `/api/v1/health`
- `/api/v1/agents`
- `/api/v1/workflows`
- `/api/v1/runs`
- local `.agent-deck` sample
- workflow runner with mocked agent execution
- local JSON run history
- basic local UI showing agents, workflows, and run status

## First Demo Flow

```bash
fabric serve
```

Then open:

```text
http://localhost:PORT
```

Run a mock RCA workflow:

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

Expected result:

- UI shows workflow steps
- each mocked agent emits a run event
- local run history is persisted
- final mock RCA report is displayed

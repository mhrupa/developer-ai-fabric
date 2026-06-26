# Development Sequence

## Build Order

1. Local service skeleton
2. Health API
3. Agent deck file loader
4. Agent catalog API
5. Workflow catalog API
6. Local orchestration engine abstraction
7. Local run state persistence
8. Workflow runner with mocked agents
9. Run events stream
10. Local UI dashboard
11. Agent catalog UI
12. Workflow orchestration UI
13. RCA run page
14. Remote KB client interface
15. Jira MCP integration
16. Bug Intake Agent
17. Service Resolver Agent
18. KB Retriever Agent
19. CloudWatch MCP integration
20. GitHub/Git integration
21. Evidence Collector Agent
22. Log Analyzer Agent
23. Code Analyzer Agent
24. RCA Writer Agent
25. Reviewer Agent
26. Manual Jira posting approval
27. VS Code extension wrapper

## Milestone 1

Implement the minimum vertical slice:

```text
Local UI / CLI
  |
Local Service
  |
Agent Deck Loader
  |
Local Orchestration Engine
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

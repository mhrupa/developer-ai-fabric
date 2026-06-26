# Local UI and Orchestration Design

## Purpose

The local UI is the developer-facing control plane for Developer AI Fabric.

It should let developers:

- view all agents available in the current repository
- inspect agent inputs, outputs, tools, and model policy
- view available workflows
- start an RCA workflow from a Jira issue
- watch each workflow step run
- inspect evidence and intermediate outputs
- rerun failed or weak steps
- approve publishing actions

The UI should be structured and workflow-driven. Chat can be added as a supporting panel, but it should not be the primary orchestration model.

## UI Surfaces

### Local Web UI

The first UI surface should be a browser application served by the local service.

```text
http://localhost:<port>
```

### VS Code Webview

After the local web UI is stable, the VS Code extension can reuse the same APIs and optionally embed the same UI.

## Main Screens

### Dashboard

Shows:

- current repository
- detected service
- available workflows
- recent local runs
- remote KB connection status
- configured MCP integrations

Primary actions:

- analyze Jira bug
- open agent catalog
- search KB
- open settings

### Agent Catalog

Shows every agent loaded from `.agent-deck/agents`.

Each agent card or row should show:

- agent name
- purpose
- version
- required inputs
- outputs
- tools/MCP access
- model policy
- last run status

Actions:

- inspect metadata
- run agent with manual input
- view previous outputs

### Workflow Orchestration

Shows workflow steps as an ordered execution graph.

Example:

```text
Bug Intake
  |
Service Resolver
  |
KB Retriever
  |
Evidence Collector
  |
Log Analyzer
  |
Code Analyzer
  |
RCA Writer
  |
Reviewer
```

Actions:

- run full workflow
- run from selected step
- rerun failed step
- skip optional step
- inspect step input
- inspect step output

### RCA Run Page

Shows the live and final state of a specific run.

Sections:

- run status
- Jira input
- service context
- agent timeline
- evidence records
- similar incidents
- CloudWatch findings
- code findings
- final RCA
- reviewer notes
- publish actions

Publish actions must require approval:

- store RCA remotely
- post comment to Jira
- export Markdown
- create fix plan

### KB Search

Allows direct search against remote team knowledge.

Filters:

- service
- environment
- source
- date range
- severity

Sources:

- Jira
- RCA reports
- runbooks
- wiki
- service docs
- known errors

### Settings

Configures local and remote behavior.

Settings:

- KB API URL
- auth status
- Jira project defaults
- AWS profile or MCP profile
- default environment
- model routing mode
- log time window
- approval rules

## Event Stream

The UI should receive run progress from the local service using server-sent events or WebSockets.

Event examples:

```json
{
  "type": "step.started",
  "runId": "BUG-1234-run-001",
  "stepId": "log-analyzer",
  "agent": "log-analyzer"
}
```

```json
{
  "type": "evidence.found",
  "runId": "BUG-1234-run-001",
  "source": "cloudwatch",
  "summary": "5xx errors increased after deployment abc123"
}
```

```json
{
  "type": "approval.required",
  "runId": "BUG-1234-run-001",
  "action": "post-to-jira"
}
```

## API Contract

The UI should call only the local service.

```http
GET /api/v1/agents
GET /api/v1/workflows
POST /api/v1/runs
GET /api/v1/runs/{runId}
GET /api/v1/runs/{runId}/events
POST /api/v1/runs/{runId}/steps/{stepId}/rerun
POST /api/v1/runs/{runId}/approve
POST /api/v1/runs/{runId}/post-to-jira
POST /api/v1/kb/search
```

## Design Rules

- prioritize workflow status and evidence over chat
- show what each agent did and why
- make intermediate outputs inspectable
- keep approval actions explicit
- never call Jira, AWS, GitHub, or the vector DB directly from the UI
- keep final RCA output separate from raw evidence
- show confidence and open questions clearly

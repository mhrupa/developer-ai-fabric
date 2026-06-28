# Developer AI Fabric Architecture

## High-Level Architecture

```text
Browser UI / VS Code Extension / CLI
        |
Local Developer AI Fabric Service
        |
Agent Deck Runtime
        |
Local Orchestration Engine
        |
Agents
  - Bug Intake
  - Service Resolver
  - KB Retriever
  - Evidence Collector
  - Log Analyzer
  - Code Analyzer
  - RCA Writer
  - Reviewer
        |
MCP Client Layer + KB Client + LLM Gateway
        |
Jira / AWS CloudWatch / GitHub / Wiki / Remote KB / Bedrock / Local LLM
```

## Deployment Model

Developer AI Fabric uses a hybrid deployment model.

Local execution:

- local service
- agent orchestration
- repository analysis
- local run history
- local UI
- future VS Code webview

Remote shared platform:

- KB API
- vector database
- metadata database
- object storage
- document indexing jobs
- service registry
- audit events

This keeps execution close to the developer and codebase while preserving shared team memory.

## Local Service

The local service is the main runtime installed with the agent deck.

Responsibilities:

- expose REST and event streaming APIs
- load `.agent-deck` from the current repository
- list agents and workflows
- execute workflows through a deterministic local orchestration engine
- persist local run state
- call MCP servers
- query the remote KB API
- route LLM requests
- produce structured reports
- support manual approval actions

Suggested local APIs:

```http
GET /api/v1/health
GET /api/v1/agents
POST /api/v1/agents
GET /api/v1/skills
POST /api/v1/skills
GET /api/v1/workflows
POST /api/v1/workflows
PUT /api/v1/workflows/{workflowId}
GET /api/v1/kb/sources
POST /api/v1/kb/sources
POST /api/v1/runs
GET /api/v1/runs/{runId}
GET /api/v1/runs/{runId}/events
POST /api/v1/runs/{runId}/steps/{stepId}/rerun
POST /api/v1/runs/{runId}/approve
POST /api/v1/runs/{runId}/post-to-jira
```

## Local UI

The UI is the local orchestration control plane.

Primary screens:

- dashboard
- agent catalog
- workflow orchestration view
- RCA run page
- evidence viewer
- KB search
- settings

The UI should call only the local service. It should not call Jira, AWS, GitHub, or the vector database directly.

For the local MVP, Spring Boot should serve the browser UI from its static resources so developers start one local backend process.

The source frontend is built from `frontend/` into `backend/src/main/resources/static`.

## Local Orchestration Engine

The orchestration engine is the CrewAI-like part of Developer AI Fabric, but it is implemented as a product-owned local graph runner rather than adopting CrewAI.

The engine should provide:

- workflow loading from `.agent-deck/workflows`
- deterministic sequential execution for MVP
- typed run state
- step inputs and outputs
- evidence ledger
- event stream
- retry and rerun hooks
- approval gates
- bounded reviewer loops later

See `docs/architecture/ORCHESTRATION_ENGINE.md`.

## Agent Deck Layout

Each enabled repository should contain or receive an agent deck.

```text
.agent-deck/
  agents/
    bug-intake.agent.yaml
    service-resolver.agent.yaml
    kb-retriever.agent.yaml
    evidence-collector.agent.yaml
    log-analyzer.agent.yaml
    code-analyzer.agent.yaml
    rca-writer.agent.yaml
    reviewer.agent.yaml

  workflows/
    rca-analysis.workflow.yaml
    fix-suggestion.workflow.yaml

  mcp/
    jira.yaml
    github.yaml
    aws-cloudwatch.yaml

  config/
    service.yaml
    permissions.yaml
```

## Remote KB Platform

The remote KB platform is the shared memory layer.

```text
Local Service
  |
KB API
  |
Metadata DB + Vector DB + Object Store
```

Recommended responsibilities:

- index wiki pages, runbooks, Jira summaries, RCA reports, and service docs
- provide semantic search
- store final RCA reports
- store service ownership and environment metadata
- track audit events
- expose policy-aware APIs to local clients

Suggested APIs:

```http
GET /services/{serviceName}
GET /jira/{issueKey}/context
POST /search/similar-bugs
POST /search/runbooks
POST /rca-reports
GET /rca-reports/{issueKey}
POST /audit/events
```

## LLM Gateway

Agents should not call a model provider directly. They should call an LLM gateway abstraction.

Model routing examples:

```yaml
tasks:
  jira_summary:
    provider: bedrock
    model_class: fast
  log_clustering:
    provider: local
    model_class: small
  rca_reasoning:
    provider: bedrock
    model_class: strong
  pii_redaction:
    provider: local
    model_class: small
  code_patch_suggestion:
    provider: bedrock
    model_class: strong
```

Bedrock is the preferred production reasoning path. Local LLMs can be used for lower-risk classification, summarization, redaction, and offline developer workflows.

## Run State

Local run state should survive UI refreshes.

```text
~/.developer-ai-fabric/runs/
  BUG-1234-run-001.json
```

Remote storage should keep shared artifacts:

- final RCA report
- evidence summary
- similar issue references
- audit metadata

## Security Model

- authenticate local service access
- authenticate remote KB access using SSO or approved tokens
- enforce KB authorization server-side
- scope AWS access through approved MCP configuration
- redact secrets and PII before model calls
- audit KB reads and RCA writes
- require manual approval before Jira posting, PR creation, rollback, or config changes

## MVP Boundary

The MVP is a local modular application plus remote KB client. It should avoid unattended central orchestration and production-changing automation until RCA quality, permissions, and auditing are proven.

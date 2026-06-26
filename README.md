# Developer AI Fabric

Developer AI Fabric is a local-first AI engineering platform for running certified agent decks against real engineering work such as Jira bugs, incidents, service analysis, and fix planning.

The platform combines:

- repo-local agent decks
- a local orchestration service
- a local web UI and future VS Code extension
- MCP integrations for Jira, GitHub, AWS, wiki, and other tools
- a remote shared knowledge base for team memory
- model routing across AWS Bedrock, local LLMs, and other approved providers

## Target Workflow

```text
Developer opens a service repo
  |
Developer runs the local Developer AI Fabric service
  |
Local UI displays available agents and workflows
  |
Developer starts RCA for a Jira bug
  |
Local orchestration runs the repo agent deck
  |
Agents gather Jira, CloudWatch, GitHub, wiki, KB, and local repo context
  |
System produces evidence-backed RCA, mitigation, and optional fix plan
  |
Developer reviews and optionally posts the result to Jira
```

## Architecture Summary

```text
Browser UI / VS Code / CLI
        |
Local Developer AI Fabric Service
        |
Agent Deck Runtime
        |
Agents + Workflows
        |
MCP Servers + Remote KB API + LLM Gateway
        |
Jira / AWS CloudWatch / GitHub / Wiki / Vector DB / Bedrock / Local LLM
```

## Local Responsibilities

- load the agent deck from the current repository
- display agents and workflows in a UI
- orchestrate agent workflow execution
- read local repository files
- run local commands, tests, and static analysis where allowed
- call MCP servers for Jira, GitHub, AWS, and other systems
- query the remote shared KB
- produce RCA reports, mitigation plans, and fix suggestions

## Remote Responsibilities

- shared knowledge base
- vector search over incidents, runbooks, wiki pages, and RCA reports
- service registry and ownership metadata
- final RCA report storage
- audit events
- centralized document indexing
- optional model and prompt policy registry

## MVP Scope

The first MVP should deliver:

- local service
- agent deck loader
- workflow runner
- local web UI
- Jira bug RCA workflow
- remote KB search client
- MCP integration points for Jira, AWS CloudWatch, and GitHub
- evidence-backed RCA report generation
- local run history
- optional manual posting to Jira

Do not start with automatic production fixes, rollbacks, or unattended central orchestration.

## Documentation

Start with:

- `docs/product/PROJECT_CONTEXT.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DECISIONS.md`
- `docs/product/ROADMAP.md`
- `docs/product/UI_ORCHESTRATION.md`
- `docs/development/AGENT_SPECIFICATION.md`
- `docs/development/DEVELOPMENT_SEQUENCE.md`
- `docs/development/CODEX_TASK_001.md`

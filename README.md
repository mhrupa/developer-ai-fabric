# Developer AI Fabric

Developer AI Fabric is an internal AI engineering platform for combining team agents, local LLMs, engineering knowledge, and developer tooling into a unified developer experience.

## Vision

Move the team from AI-assisted coding to AI-assisted software engineering.

The platform provides a common layer around:

- GitHub Copilot usage
- Team-certified agents
- Local LLMs using Ollama
- Organizational engineering memory
- Project context and standards
- GitHub/Jira/Confluence/Sonar integrations
- CLI and VS Code developer workflows

## MVP Stack

- Java 21
- Spring Boot 3.x
- Spring AI
- Ollama
- Qdrant
- MySQL
- CLI first
- VS Code extension later

## MVP Commands

```bash
fabric execute --command /explain-service --project OMS --repo ./oms-v2
fabric execute --command /review-pr --project OMS --pr 123
fabric execute --command /incident --project OMS --input error.log
```

## First MVP Scope

- AI Gateway
- Agent Registry
- Model Router
- Ollama Client
- Basic Agent Runtime
- MySQL persistence
- Service Explain Agent
- CLI

## Codex Usage

Codex should first read:

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `docs/codex-task-001.md`

Implementation must follow the decisions and boundaries documented in this repository.

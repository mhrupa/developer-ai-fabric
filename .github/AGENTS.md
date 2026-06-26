# Developer AI Fabric - Codex Guide

This repository is the source of truth for Developer AI Fabric. Codex should use this file and the documents under `docs/` to continue phased development without needing prior chat context.

## Vision

Developer AI Fabric is a local-first AI engineering platform that lets developers run repo-local agent decks through a local service and UI while sharing organizational knowledge through a remote KB.

The target outcome is to move from isolated AI coding assistance to evidence-backed AI software engineering workflows.

## Current Product Direction

The platform should provide:

- local orchestration service
- repo-local `.agent-deck`
- local web UI
- future VS Code extension
- remote shared KB
- MCP integrations for Jira, GitHub, AWS CloudWatch, wiki, and related systems
- LLM gateway for AWS Bedrock, local LLMs, and other approved providers

## Source Documents

Read these before implementation:

- `README.md`
- `docs/product/PROJECT_CONTEXT.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DECISIONS.md`
- `docs/product/ROADMAP.md`
- `docs/product/UI_ORCHESTRATION.md`
- `docs/development/DEVELOPMENT_SEQUENCE.md`
- `docs/development/AGENT_SPECIFICATION.md`
- `docs/development/CODEX_TASK_001.md`

## Expected Repository Structure

- `.agent-deck/` - sample local agent deck metadata and workflows
- `service/` - local Developer AI Fabric service
- `ui/` - local web UI
- `cli/` - optional CLI wrapper
- `vscode-extension/` - VS Code integration after local UI is stable
- `docs/` - product, architecture, and development knowledge

## Development Principles

- Build in phases.
- Prefer vertical slices over isolated layers.
- Keep the repo runnable after every phase.
- Keep external integrations behind interfaces.
- Keep UI calls routed through the local service.
- Keep model calls behind an LLM gateway.
- Keep MCP access explicit and auditable.
- Use structured request and response DTOs.
- Persist local run state.
- Include evidence, confidence, and open questions in RCA output.
- Require human approval for Jira posting, PR creation, rollback, or config changes.
- Update documentation when architecture or usage changes.
- Record major decisions in `docs/architecture/DECISIONS.md`.

## Core Platform Components

### Local Service

The local service loads the agent deck, exposes APIs, runs workflows, streams events, persists local run history, calls MCP integrations, queries the remote KB, and coordinates model usage.

### Agent Deck Runtime

The runtime reads `.agent-deck/agents`, `.agent-deck/workflows`, MCP config, service config, and permissions. It executes workflows step by step and records each agent result.

### Local UI

The UI displays available agents, workflows, RCA runs, evidence, KB search, and approvals. The UI should call the local service only.

### Remote KB

The remote KB stores shared engineering memory, including runbooks, wiki pages, past incidents, RCA reports, service registry data, and semantic embeddings.

### LLM Gateway

The gateway routes tasks to AWS Bedrock, local LLMs, or other approved providers based on task type, sensitivity, cost, and availability.

## Phased Development

Follow `docs/development/DEVELOPMENT_SEQUENCE.md`.

Current priority is Phase 1: local service vertical slice.

Phase 1 must deliver:

- local service project
- health endpoint
- agents endpoint
- workflows endpoint
- runs endpoint
- sample `.agent-deck`
- mocked RCA workflow runner
- local run history
- basic local UI

## Codex Execution Rules

1. Read this file first.
2. Read the relevant docs under `docs/`.
3. Implement the next incomplete phase.
4. Prefer small, reviewable changes.
5. Keep the repository buildable and runnable.
6. Add or update tests.
7. Update documentation when behavior changes.
8. When ambiguous, choose the simplest option aligned with documented decisions.
9. Continue development inside this repository using the documented roadmap.

## Current Next Task

Start with `docs/development/CODEX_TASK_001.md` and implement the first local Developer AI Fabric vertical slice.

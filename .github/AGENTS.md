# Developer AI Fabric - Codex Guide

This repository is the source of truth for Developer AI Fabric. Codex should use this file and the documents under `docs/` to continue phased development without needing prior chat context.

## Vision

Developer AI Fabric is an internal AI engineering platform that combines GitHub Copilot, team agents, local LLMs, engineering knowledge, and developer workflows into one controlled engineering layer.

The target outcome is to move from AI-assisted coding to AI-assisted software engineering.

## Approved Stack

- Java 21
- Spring Boot 3.x
- Spring AI
- Ollama
- Qdrant
- MySQL
- Maven
- CLI first
- VS Code extension after MVP

## Source Documents

Read these before implementation:

- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DECISIONS.md`
- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/ROADMAP.md`
- `docs/development/DEVELOPMENT_SEQUENCE.md`
- `docs/development/AGENT_SPECIFICATION.md`
- `docs/development/CODEX_TASK_001.md`

## Repository Structure

- `gateway/` - Spring Boot AI Gateway
- `agents/` - agent metadata, prompts, and policies
- `model-router/` - model selection and routing policies
- `context-engine/` - ingestion, embeddings, retrieval, and Qdrant integration
- `integrations/` - GitHub, Jira, Confluence, SonarQube, Azure DevOps connectors
- `cli/` - developer command line interface
- `vscode-extension/` - VS Code integration after MVP
- `docs/` - product, architecture, and development knowledge

## Development Principles

- Build in phases.
- Prefer vertical slices over isolated layers.
- Keep the repo runnable after every phase.
- Keep modules loosely coupled.
- Use clear interfaces between gateway, agents, model router, context engine, persistence, and integrations.
- Use constructor injection.
- Keep controllers thin and business logic in services.
- Use structured request and response DTOs.
- Use environment-based configuration.
- Add tests with each meaningful capability.
- Update documentation when architecture or usage changes.
- Record major decisions in `docs/architecture/DECISIONS.md`.

## Core Platform Components

### AI Gateway

Receives developer requests, validates input, resolves commands, invokes agents, returns structured responses, and records execution data.

Initial APIs:

- health check
- list agents
- execute command

### Agent Registry

Maintains approved agents, command mappings, required tools, model policy, and output contracts.

Initial agents:

- Service Explain Agent
- PR Review Agent
- Incident Helper Agent
- ADR Agent
- Test Plan Agent

### Model Router

Selects the model runtime based on agent policy, request type, sensitivity, and availability. The first runtime is Ollama through Spring AI.

### Context Engine

Indexes and retrieves engineering knowledge from architecture docs, ADRs, migration playbooks, runbooks, coding standards, incidents, READMEs, and project documentation.

### Persistence

MySQL stores users, projects, agents, executions, execution steps, usage metrics, feedback, routing policies, and knowledge sources.

Qdrant stores document embeddings and project knowledge vectors.

## Phased Development

Follow `docs/development/DEVELOPMENT_SEQUENCE.md`.

Current priority is Phase 1: Spring Boot gateway vertical slice.

Phase 1 must deliver:

- Spring Boot project under `gateway/`
- Java 21 Maven setup
- health endpoint
- agents endpoint
- execute endpoint
- agent interface
- simple agent registry
- model router abstraction
- Ollama integration through Spring AI
- Service Explain Agent
- basic tests

## Agent Response Contract

Each agent response should include:

- agent id
- agent name
- model used
- execution status
- structured result
- evidence when available
- recommendations
- follow-up actions

Normalize model output before returning API responses.

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

Start with `docs/development/CODEX_TASK_001.md` and implement the first working Spring Boot gateway vertical slice.

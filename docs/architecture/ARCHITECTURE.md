# Developer AI Fabric Architecture

## High-Level Architecture

```text
Developer
  ↓
CLI / VS Code Extension
  ↓
AI Gateway
  ↓
Agent Registry + Model Router + Context Engine
  ↓
Spring AI + Ollama + Qdrant + MySQL
  ↓
GitHub / Jira / Confluence / SonarQube / Azure DevOps
```

## Core Components

### AI Gateway

Receives developer requests, validates input, resolves command intent, invokes the agent runtime, and returns structured responses.

### Agent Registry

Maintains approved team agents, command mappings, model policies, required tools, and output contracts.

### Model Router

Selects the correct model runtime based on request type, sensitivity, project policy, and fallback rules.

### Context Engine

Retrieves project-specific engineering context from documentation, code summaries, architecture decisions, incidents, and standards.

### Agent Runtime

Executes agent workflows using Spring Boot and Spring AI. MVP should avoid heavy orchestration frameworks.

### Persistence Layer

MySQL stores users, projects, agent metadata, execution history, usage metrics, and feedback.

### Vector Layer

Qdrant stores embeddings for architecture documents, ADRs, runbooks, coding standards, incidents, and project documentation.

## MVP Boundary

The MVP should be a modular monolith with package-level separation. Microservice decomposition should be considered only after core workflows stabilize.

# Development Sequence

## Build Order

1. Repository structure
2. Spring Boot gateway skeleton
3. Health API
4. Agent interface
5. Agent registry
6. Ollama integration through Spring AI
7. Model router
8. Service Explain Agent
9. MySQL persistence
10. CLI
11. Qdrant context engine
12. GitHub connector
13. PR Review Agent
14. Incident Helper Agent
15. VS Code extension

## Milestone 1

Implement the minimum vertical slice:

```text
CLI → AI Gateway → Agent Registry → Model Router → Ollama → Response
```

## Milestone 1 Deliverables

- Spring Boot project
- Java 21
- Maven build
- `/api/v1/health`
- `/api/v1/agents`
- `/api/v1/execute`
- Agent interface
- YAML or database-backed agent registry
- Service Explain Agent
- Ollama client via Spring AI
- Basic CLI command

## First Demo Command

```bash
fabric execute --command /explain-service --project OMS --input "Spring Boot inventory service with MySQL and REST APIs"
```

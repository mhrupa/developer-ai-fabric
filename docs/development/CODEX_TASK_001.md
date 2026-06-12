# Codex Task 001 - Bootstrap Developer AI Fabric Gateway

## Goal

Create the first working vertical slice of Developer AI Fabric.

## Stack

- Java 21
- Spring Boot 3.x
- Maven
- Spring AI
- Ollama
- MySQL later
- Qdrant later

## Implement

1. Create Spring Boot gateway project under `gateway/`
2. Add `/api/v1/health`
3. Add `/api/v1/agents`
4. Add `/api/v1/execute`
5. Create agent interface
6. Create in-memory or YAML-backed agent registry
7. Create model router abstraction
8. Integrate Ollama through Spring AI
9. Implement Service Explain Agent
10. Add basic tests

## Constraints

- Do not add LangGraph
- Do not add Python services
- Do not add VS Code extension yet
- Do not add Jira, Confluence, or Sonar integration yet
- Keep the implementation modular
- Use environment variables for model configuration

## Expected Test Request

```json
{
  "command": "/explain-service",
  "project": "OMS",
  "input": "Spring Boot inventory service using MySQL and REST APIs"
}
```

## Expected Response Shape

```json
{
  "agent": "service-explain",
  "model": "ollama",
  "result": {
    "overview": "...",
    "dependencies": [],
    "apis": [],
    "risks": []
  }
}
```

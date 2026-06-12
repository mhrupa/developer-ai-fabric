# Developer AI Fabric - Agent Instructions

## Technology Stack

- Java 21
- Spring Boot 3.x
- Spring AI
- Ollama
- Qdrant
- MySQL

## Development Principles

- Prefer clean architecture
- Keep modules loosely coupled
- Use constructor injection
- Use immutable DTOs where possible
- Use structured JSON APIs
- Follow SOLID principles
- No hardcoded secrets
- Environment driven configuration

## Repository Structure

gateway/
agents/
model-router/
context-engine/
integrations/
cli/
docs/

## MVP Priority

1. AI Gateway
2. Agent Registry
3. Ollama Integration
4. Model Router
5. Service Explain Agent
6. MySQL Persistence
7. CLI

## Avoid

- LangGraph in MVP
- Complex orchestration frameworks initially
- Premature microservices
- Multiple UI applications in MVP

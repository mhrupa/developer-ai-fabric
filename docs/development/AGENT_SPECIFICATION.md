# Agent Specification

Each certified agent should define a stable contract.

## Required Metadata

```yaml
id: service-explain
command: /explain-service
name: Service Explain Agent
description: Explains a service using repository and project context
modelPolicy:
  default: local
  fallback: cloud
tools:
  - repository-reader
  - context-search
output:
  - overview
  - dependencies
  - apis
  - risks
```

## Required Output Principles

- Return structured JSON from APIs
- Render readable Markdown in CLI or VS Code
- Include evidence where available
- Separate findings from recommendations
- Do not make unsupported claims

## Initial Agents

### Service Explain Agent

Purpose:
- Explain service purpose
- Identify APIs
- Identify dependencies
- Identify database usage
- Highlight risks

### PR Review Agent

Purpose:
- Review code quality
- Review security
- Review performance
- Identify missing tests
- Generate suggested comments

### Incident Helper Agent

Purpose:
- Analyze error input
- Identify likely root cause
- Search similar knowledge
- Suggest fix
- Generate test cases
- Draft postmortem

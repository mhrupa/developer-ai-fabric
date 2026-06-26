# Agent Specification

Each certified agent must define a stable, inspectable contract.

## Agent Metadata

```yaml
id: log-analyzer
name: Log Analyzer Agent
description: Analyzes CloudWatch logs and metrics for incident evidence
version: 1.0.0
modelPolicy:
  defaultTask: log_analysis
  allowLocal: true
  allowCloud: true
tools:
  - aws-cloudwatch-mcp
  - kb-search
inputs:
  - jiraIssue
  - serviceContext
  - timeWindow
  - logGroups
outputs:
  - errorPatterns
  - stackTraces
  - metricFindings
  - evidence
  - openQuestions
```

## Required Output Principles

- return structured JSON from local service APIs
- render readable Markdown in the UI, CLI, or Jira
- include evidence wherever possible
- separate findings from recommendations
- include confidence and open questions
- do not make unsupported claims
- cite source systems and time windows

## Evidence Record

Agents that collect or analyze external data should return evidence records.

```json
{
  "source": "cloudwatch",
  "service": "payment-api",
  "environment": "prod",
  "reference": "/aws/ecs/payment-api",
  "timeWindow": "2026-06-26T08:00:00Z/2026-06-26T12:00:00Z",
  "summary": "5xx errors increased after deployment abc123",
  "confidence": "medium"
}
```

## Initial Agents

### Bug Intake Agent

Purpose:

- read Jira issue details
- extract severity, impact, service hints, timestamps, customer data, repro steps, and linked issues
- normalize the issue into workflow input

### Service Resolver Agent

Purpose:

- map bug context to service, repo, owners, AWS account, region, CloudWatch log groups, and runbooks
- use repo-local `.agent-deck/config/service.yaml` and remote service registry

### KB Retriever Agent

Purpose:

- search similar bugs
- search runbooks and wiki pages
- search past RCA reports
- return ranked context with source metadata

### Evidence Collector Agent

Purpose:

- collect Jira comments and attachments
- collect CloudWatch logs and metrics
- collect recent GitHub deployments, commits, and PRs
- collect local repo context

### Log Analyzer Agent

Purpose:

- identify error spikes
- find stack traces and repeated exceptions
- correlate errors with time windows, deployments, tenants, and request IDs
- summarize evidence

### Code Analyzer Agent

Purpose:

- inspect likely code paths
- identify recent changes
- find configuration and dependency risks
- suggest files and tests to inspect

### RCA Writer Agent

Purpose:

- combine evidence into a structured RCA
- include suspected root cause, mitigation, confidence, and open questions
- produce Jira-ready Markdown after approval

### Reviewer Agent

Purpose:

- verify the RCA is supported by evidence
- identify weak assumptions
- recommend whether the RCA is ready to share

## RCA Output Contract

```json
{
  "issueKey": "BUG-1234",
  "service": "payment-api",
  "environment": "prod",
  "summary": "...",
  "suspectedRootCause": "...",
  "confidence": "medium",
  "evidence": [],
  "mitigation": [],
  "openQuestions": [],
  "checkedSources": {
    "jira": true,
    "kb": true,
    "cloudwatch": true,
    "github": true,
    "localRepo": true
  }
}
```

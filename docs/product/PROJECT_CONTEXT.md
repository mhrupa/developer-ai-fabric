# Developer AI Fabric Context

## Objective

Build a local-first AI engineering fabric that allows developers to run certified agent decks from a repository while sharing organizational knowledge through a remote KB.

The first strategic use case is customer bug analysis from Jira, including evidence collection from CloudWatch logs, service repositories, GitHub history, wiki/runbooks, and past RCA reports.

## Product Principles

- Execution should run locally on the developer machine.
- Knowledge should be shared remotely across the team.
- Agents should be visible, inspectable, and orchestrated through a UI.
- Every RCA should be evidence-backed.
- Model usage should be routed through a provider abstraction.
- Human approval is required before posting to Jira, creating PRs, or suggesting production actions.

## Core Capabilities

- Local orchestration service
- Repo-local agent deck runtime
- Local web UI
- Future VS Code extension
- Remote shared KB and vector search
- Jira, GitHub, AWS CloudWatch, wiki, and service registry integrations
- LLM gateway for Bedrock, local LLMs, and other approved providers
- RCA report storage and audit trail

## Primary Workflow: Jira Bug RCA

Inputs:

- Jira issue key
- service or repository
- environment
- incident time window
- optional customer, tenant, request ID, correlation ID, or error message

Outputs:

- bug summary
- suspected root cause
- supporting evidence
- CloudWatch findings
- related past incidents
- runbook/wiki references
- relevant code references
- confidence level
- mitigation plan
- open questions
- optional Jira-ready Markdown comment

## First Agent Set

### Bug Intake Agent

Extracts structured information from Jira, including severity, impact, environment, timestamps, customer identifiers, repro steps, attachments, and linked issues.

### Service Resolver Agent

Maps the bug to a service, repository, AWS account, region, CloudWatch log groups, ownership team, and runbooks.

### KB Retriever Agent

Searches the remote KB for similar incidents, known error patterns, service docs, runbooks, and historical RCA reports.

### Evidence Collector Agent

Collects evidence from Jira, CloudWatch, GitHub, wiki, service registry, and local repository context.

### Log Analyzer Agent

Analyzes CloudWatch logs and metrics around the issue time window for errors, spikes, stack traces, latency, dependency failures, throttling, and correlation IDs.

### Code Analyzer Agent

Inspects the local repo and Git history for likely code paths, recent changes, configuration risks, tests, and fix locations.

### RCA Writer Agent

Produces a structured RCA report with confidence, evidence, mitigation, and open questions.

### Reviewer Agent

Checks whether the RCA conclusion is supported by collected evidence and flags weak assumptions.

## Long-Term Vision

Create a developer-controlled AI engineering control plane where teams can inspect, orchestrate, and improve agent workflows while reusing a shared organizational memory.

# Development Roadmap

## Phase 0: Product and Architecture Baseline

- finalize local-first architecture
- define agent deck structure
- define remote KB responsibilities
- define RCA output contract
- define UI screens and local APIs

## Phase 1: Local Service Vertical Slice

- create local service skeleton
- add health API
- load agent deck metadata from `.agent-deck`
- expose agents and workflows APIs
- create basic workflow runner
- persist local run state
- add CLI command to start an RCA run

## Phase 2: Local UI

- add local web UI
- show dashboard
- show agent catalog
- show workflow orchestration view
- show RCA run timeline
- stream run events from local service
- support rerun from a failed step

## Phase 3: Remote KB Client

- configure KB API URL and auth
- add semantic search client
- search similar bugs and runbooks
- fetch service registry metadata
- store final RCA report remotely
- write audit events

## Phase 4: Jira RCA Workflow

- add Jira MCP integration
- implement Bug Intake Agent
- implement Service Resolver Agent
- implement KB Retriever Agent
- generate first structured RCA report from Jira plus KB context

## Phase 5: AWS and GitHub Evidence

- add AWS CloudWatch MCP integration
- add GitHub/Git repo context integration
- implement Evidence Collector Agent
- implement Log Analyzer Agent
- implement Code Analyzer Agent

## Phase 6: RCA Quality and Review

- implement RCA Writer Agent
- implement Reviewer Agent
- add confidence scoring
- add evidence citations
- add unsupported-claim checks
- add manual Jira posting approval

## Phase 7: Fix Planning

- add Fix Planner Agent
- identify impacted files
- suggest tests
- draft mitigation steps
- optionally create a local branch and patch after approval

## Phase 8: VS Code Extension

- embed the local UI in a VS Code webview
- open impacted files from RCA evidence
- run selected agents from the editor
- show Jira and RCA context next to code

## Phase 9: Central Automation Option

- add optional central Jira webhook orchestrator
- reuse the same agent deck runtime and KB APIs
- restrict to selected Jira labels and services
- keep human approval for side effects

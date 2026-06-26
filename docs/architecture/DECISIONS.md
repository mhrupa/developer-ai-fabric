# Architecture Decisions

## ADR-001: Local-First Execution

Developer AI Fabric runs orchestration locally on the developer machine.

Reason:

- the local machine has the checked-out repository, branch context, build tools, tests, and developer workflow context
- developers can inspect and approve agent activity
- the system can be adopted without immediately operating a central automation platform

## ADR-002: Remote Shared Knowledge Base

All shared engineering memory is stored remotely behind a KB API.

Reason:

- local-only knowledge does not scale across teams
- indexing must be consistent
- access control and audit must be centralized
- past RCA reports and runbooks must be reusable by everyone

## ADR-003: UI as Local Orchestration Control Plane

The local UI displays agents, workflows, runs, evidence, and approvals.

Reason:

- agent orchestration must be visible and inspectable
- developers need to rerun steps, inspect evidence, and approve outputs
- chat alone is not enough for reliable RCA workflows

## ADR-004: Agent Decks Are Repo-Local

Each service repository can contain or receive a `.agent-deck` directory.

Reason:

- service-specific workflows, permissions, and mappings belong close to the repo
- teams can version agent behavior with service code
- the local service can load the current repo context without central assumptions

## ADR-005: MCP for External Tool Access

Jira, GitHub, AWS CloudWatch, wiki, and related integrations should be accessed through MCP servers or MCP-compatible adapters.

Reason:

- tool access becomes explicit and auditable
- agents can use a consistent tool interface
- new enterprise tools can be added without rewriting agents

## ADR-006: LLM Gateway Abstraction

Agents call an LLM gateway instead of provider SDKs directly.

Reason:

- model routing can choose Bedrock, local LLMs, or other approved providers
- provider changes do not require agent rewrites
- routing can account for sensitivity, cost, latency, and task complexity

## ADR-007: Bedrock Preferred for Production RCA Reasoning

AWS Bedrock is the preferred managed model path for high-quality production RCA reasoning.

Reason:

- managed scaling and availability
- IAM integration
- enterprise governance
- strong model options

Local LLMs remain useful for lower-risk subtasks and offline workflows.

## ADR-008: Human Approval for Side Effects

The system may suggest Jira comments, PRs, fixes, rollbacks, or config changes, but those actions require human approval.

Reason:

- RCA can affect production and customer communication
- unsupported conclusions must not be posted automatically
- developer trust depends on clear approval boundaries

## ADR-009: No Unattended Central Orchestration in MVP

The MVP should not automatically process every Jira issue from a central worker.

Reason:

- local workflow and KB quality should be proven first
- permissions and evidence standards need validation
- central orchestration can be added later using the same agent runtime and KB APIs

## ADR-010: Evidence-Backed Output Contract

RCA output must include evidence, confidence, and open questions.

Reason:

- unsupported claims are dangerous
- reviewers need to see why the agent reached a conclusion
- stored RCA reports become future KB inputs

## ADR-011: Product-Owned Orchestration Engine

Developer AI Fabric should use a CrewAI-like multi-agent orchestration model, but should not depend on CrewAI.

Reason:

- orchestration must be deterministic and auditable by default
- the UI needs direct visibility into each step, event, evidence record, and approval gate
- side-effect controls must be enforced by the runtime
- typed state is safer than passing only free-form chat history between agents
- avoiding framework lock-in keeps the local service and future central orchestrator aligned

import { saveRun } from './run-store.mjs';

export async function runWorkflow({ workflow, agents, input }) {
  const createdAt = new Date().toISOString();
  const issueKey = normalizeIdPart(input?.jiraIssueKey || 'LOCAL');
  const runId = `${issueKey}-${Date.now()}`;
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  const run = {
    runId,
    workflow: workflow.id,
    workflowName: workflow.name,
    status: 'running',
    input,
    createdAt,
    completedAt: null,
    steps: [],
    events: [
      event('run.started', runId, {
        workflow: workflow.id,
        message: `Started ${workflow.name}`,
      }),
    ],
    result: null,
  };

  for (const step of workflow.steps || []) {
    const agent = agentById.get(step.agent);
    const startedAt = new Date().toISOString();
    run.events.push(event('step.started', runId, { stepId: step.id, agent: step.agent }));

    const output = mockAgentOutput(step, agent, input);
    const completedAt = new Date().toISOString();
    run.steps.push({
      id: step.id,
      agent: step.agent,
      agentName: agent?.name || step.agent,
      status: 'completed',
      startedAt,
      completedAt,
      output,
    });

    if (output.evidence) {
      for (const evidence of output.evidence) {
        run.events.push(event('evidence.found', runId, evidence));
      }
    }

    run.events.push(event('step.completed', runId, { stepId: step.id, agent: step.agent }));
  }

  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.result = buildRcaResult(input, run.steps);
  run.events.push(event('approval.required', runId, { action: 'post-to-jira' }));
  run.events.push(event('run.completed', runId, { workflow: workflow.id }));

  await saveRun(run);
  return run;
}

function mockAgentOutput(step, agent, input) {
  const service = input?.service || 'unknown-service';
  const issueKey = input?.jiraIssueKey || 'UNKNOWN';
  const environment = input?.environment || 'unknown';

  switch (step.agent) {
    case 'bug-intake':
      return {
        summary: `${issueKey} normalized for RCA analysis.`,
        severity: 'unknown',
        serviceHints: [service],
        timeWindowHours: input?.timeWindowHours || 4,
      };
    case 'service-resolver':
      return {
        service,
        environment,
        repository: `org/${service}`,
        owners: ['service-owner-team'],
        logGroups: [`/aws/ecs/${service}`],
      };
    case 'kb-retriever':
      return {
        similarIncidents: [
          {
            id: 'RCA-1024',
            title: `Prior ${service} customer-impacting timeout`,
            confidence: 'medium',
          },
        ],
        runbooks: [`${service} production triage runbook`],
      };
    case 'evidence-collector':
      return {
        evidence: [
          {
            source: 'jira',
            summary: `Collected Jira context for ${issueKey}.`,
            confidence: 'medium',
          },
          {
            source: 'github',
            summary: `Mock recent deployment context for ${service}.`,
            confidence: 'low',
          },
        ],
      };
    case 'log-analyzer':
      return {
        errorPatterns: ['5xx spike placeholder', 'timeout placeholder'],
        evidence: [
          {
            source: 'cloudwatch',
            summary: `Mock CloudWatch scan for /aws/ecs/${service} in ${environment}.`,
            confidence: 'low',
          },
        ],
      };
    case 'code-analyzer':
      return {
        impactedFiles: ['src/main', 'config'],
        recentChanges: ['Mock recent commit touching request handling.'],
        testSuggestions: ['Add regression coverage for timeout and dependency failure paths.'],
      };
    case 'rca-writer':
      return {
        summary: `Mock RCA generated for ${issueKey}.`,
        suspectedRootCause: 'Insufficient live integrations in this first slice; RCA is a placeholder.',
        confidence: 'low',
      };
    case 'reviewer':
      return {
        readiness: 'needs-real-evidence',
        weakAssumptions: ['Jira, KB, CloudWatch, and GitHub integrations are mocked.'],
      };
    default:
      return {
        summary: `${agent?.name || step.agent} completed.`,
      };
  }
}

function buildRcaResult(input, steps) {
  const evidence = steps.flatMap((step) => step.output?.evidence || []);
  return {
    issueKey: input?.jiraIssueKey || 'UNKNOWN',
    service: input?.service || 'unknown-service',
    environment: input?.environment || 'unknown',
    summary: 'Mock RCA workflow completed using local agent orchestration.',
    suspectedRootCause: 'Real root cause is not determined yet because external MCP and KB integrations are mocked in this slice.',
    confidence: 'low',
    evidence,
    mitigation: [
      'Wire Jira MCP, remote KB, CloudWatch MCP, and GitHub context before using RCA output operationally.',
      'Keep Jira posting behind explicit approval.',
    ],
    openQuestions: [
      'What is the real Jira payload?',
      'Which CloudWatch log groups should be searched?',
      'Which deployment or commit changed near the incident window?',
    ],
    checkedSources: {
      jira: false,
      kb: false,
      cloudwatch: false,
      github: false,
      localRepo: true,
    },
  };
}

function event(type, runId, payload) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    runId,
    createdAt: new Date().toISOString(),
    ...payload,
  };
}

function normalizeIdPart(value) {
  return String(value).replace(/[^a-zA-Z0-9-]/g, '-');
}

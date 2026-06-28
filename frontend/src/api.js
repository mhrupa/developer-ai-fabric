export async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchHealth() {
  return api('/api/v1/health');
}

export async function fetchAgents() {
  const data = await api('/api/v1/agents');
  return data.agents || [];
}

export async function fetchWorkflows() {
  const data = await api('/api/v1/workflows');
  return data.workflows || [];
}

export async function fetchSkills() {
  const data = await api('/api/v1/skills');
  return data.skills || [];
}

export async function fetchKbSources() {
  const data = await api('/api/v1/kb/sources');
  return data.sources || [];
}

export async function saveAgent(agent) {
  const data = await api('/api/v1/agents', {
    method: 'POST',
    body: JSON.stringify(agent),
  });
  return data.agent;
}

export async function saveSkill(skill) {
  const data = await api('/api/v1/skills', {
    method: 'POST',
    body: JSON.stringify(skill),
  });
  return data.skill;
}

export async function saveWorkflow(workflow) {
  const data = await api('/api/v1/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  });
  return data.workflow;
}

export async function saveKbSource(source) {
  const data = await api('/api/v1/kb/sources', {
    method: 'POST',
    body: JSON.stringify(source),
  });
  return data.source;
}

export async function fetchRuns() {
  const data = await api('/api/v1/runs');
  return data.runs || [];
}

export async function createRun(payload) {
  return api('/api/v1/runs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchRun(runId) {
  return api(`/api/v1/runs/${runId}`);
}

export async function approveRun(runId, approver = 'local-user') {
  return api(`/api/v1/runs/${runId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approver }),
  });
}

export async function rerunStep(runId, stepId) {
  return api(`/api/v1/runs/${runId}/steps/${stepId}/rerun`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function searchKnowledgeBase(query) {
  return api('/api/v1/kb/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

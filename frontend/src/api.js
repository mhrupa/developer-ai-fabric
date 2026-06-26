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

export async function searchKnowledgeBase(query) {
  return api('/api/v1/kb/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

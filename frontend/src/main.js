import {
  createRun,
  fetchAgents,
  fetchHealth,
  fetchRun,
  fetchRuns,
  fetchWorkflows,
  searchKnowledgeBase,
} from './api.js';
import { getElements } from './dom.js';
import { renderApp, renderKbResults, showRun, showView } from './renderers.js';
import { state } from './state.js';

const elements = getElements();

for (const button of elements.viewButtons) {
  button.addEventListener('click', () => showView(state, elements, button.dataset.viewTarget));
}

elements.refreshButton.addEventListener('click', loadAll);
elements.runForm.addEventListener('submit', startRun);
elements.kbForm.addEventListener('submit', searchKb);

await loadAll();

async function loadAll() {
  await Promise.all([loadHealth(), loadAgents(), loadWorkflows(), loadRuns()]);
  renderApp({ state, elements, onRunSelected: selectRun });
}

async function loadHealth() {
  try {
    const health = await fetchHealth();
    elements.healthStatus.textContent = health.status === 'ok' ? 'Connected' : 'Unknown';
    elements.statusDot.classList.toggle('ok', health.status === 'ok');
  } catch {
    elements.healthStatus.textContent = 'Offline';
    elements.statusDot.classList.remove('ok');
  }
}

async function loadAgents() {
  state.agents = await fetchAgents();
}

async function loadWorkflows() {
  state.workflows = await fetchWorkflows();
}

async function loadRuns() {
  state.runs = await fetchRuns();
}

async function startRun(event) {
  event.preventDefault();
  const formData = new FormData(elements.runForm);
  const workflow = state.workflows[0]?.id || 'rca-analysis';
  const run = await createRun({
    workflow,
    input: {
      jiraIssueKey: formData.get('jiraIssueKey'),
      service: formData.get('service'),
      environment: formData.get('environment'),
      timeWindowHours: Number(formData.get('timeWindowHours')),
    },
  });

  await loadRuns();
  renderApp({ state, elements, onRunSelected: selectRun });
  showView(state, elements, 'workflow-execution');
  showRun(elements, run);
}

async function selectRun(runId) {
  const run = await fetchRun(runId);
  showRun(elements, run);
}

async function searchKb(event) {
  event.preventDefault();
  const formData = new FormData(elements.kbForm);
  const data = await searchKnowledgeBase(formData.get('query'));
  renderKbResults(elements, data.results || []);
}

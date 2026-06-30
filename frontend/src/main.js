import {
  approveRun,
  createRun,
  fetchAgents,
  fetchHealth,
  fetchKbSources,
  fetchRun,
  fetchRuns,
  fetchSkills,
  fetchWorkflows,
  saveAgent,
  saveKbSource,
  saveSkill,
  saveWorkflow,
  rerunStep,
  searchKnowledgeBase,
} from './api.js';
import { getElements } from './dom.js';
import { renderApp, renderKbResults, showMessage, showRun, showView } from './renderers.js';
import { state } from './state.js';

const elements = getElements();

for (const button of elements.viewButtons) {
  button.addEventListener('click', () => showView(state, elements, button.dataset.viewTarget));
}

elements.refreshButton.addEventListener('click', loadAll);
elements.runForm.addEventListener('submit', startRun);
elements.agentForm.addEventListener('submit', saveAgentForm);
elements.skillForm.addEventListener('submit', saveSkillForm);
elements.workflowForm.addEventListener('submit', saveWorkflowForm);
elements.addWorkflowStepButton.addEventListener('click', addWorkflowStep);
elements.workflowMap.addEventListener('dragover', allowAgentDrop);
elements.workflowMap.addEventListener('dragleave', clearAgentDropState);
elements.workflowMap.addEventListener('drop', dropAgentOnCanvas);
elements.kbSourceForm.addEventListener('submit', saveKbSourceForm);
elements.kbForm.addEventListener('submit', searchKb);

await loadAll();

async function loadAll() {
  await Promise.all([loadHealth(), loadAgents(), loadSkills(), loadWorkflows(), loadKbSources(), loadRuns()]);
  syncDraftFromWorkflow();
  renderCurrentApp();
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

async function loadSkills() {
  state.skills = await fetchSkills();
}

async function loadKbSources() {
  state.kbSources = await fetchKbSources();
}

async function loadRuns() {
  state.runs = await fetchRuns();
}

async function startRun(event) {
  event.preventDefault();
  await withUiError(async () => {
    const formData = new FormData(elements.runForm);
    const workflow = formData.get('workflow') || state.workflows[0]?.id || 'rca-analysis';
    if (!workflow) {
      throw new Error('Create and save a workflow before running.');
    }
    const run = await createRun({
      workflow,
      input: {
        jiraIssueKey: formData.get('jiraIssueKey'),
        service: formData.get('service'),
        environment: formData.get('environment'),
        timeWindowHours: Number(formData.get('timeWindowHours')),
      },
    });

    state.selectedRun = run;
    await loadRuns();
    renderCurrentApp();
    showView(state, elements, 'workflow-execution');
    showCurrentRun();
  });
}

async function saveAgentForm(event) {
  event.preventDefault();
  await withUiError(async () => {
    const formData = new FormData(elements.agentForm);
    await saveAgent({
      id: formData.get('id'),
      name: formData.get('name'),
      description: `${formData.get('name')} created from the local dashboard.`,
      version: '1.0.0',
      modelPolicy: {
        defaultTask: formData.get('defaultTask') || 'general',
        allowLocal: true,
        allowCloud: true,
      },
      tools: csvList(formData.get('tools')),
      outputs: csvList(formData.get('outputs')),
    });
    await loadAgents();
    renderCurrentApp();
    showMessage(elements, 'Agent saved.');
  });
}

async function saveSkillForm(event) {
  event.preventDefault();
  await withUiError(async () => {
    const formData = new FormData(elements.skillForm);
    await saveSkill({
      id: formData.get('id'),
      name: formData.get('name'),
      description: `${formData.get('name')} created from the local dashboard.`,
      toolBinding: formData.get('toolBinding'),
      outputs: csvList(formData.get('outputs')),
    });
    await loadSkills();
    renderCurrentApp();
    showMessage(elements, 'Skill saved.');
  });
}

async function saveWorkflowForm(event) {
  event.preventDefault();
  await withUiError(async () => {
    validateWorkflowDraft();
    const formData = new FormData(elements.workflowForm);
    await saveWorkflow({
      id: formData.get('id'),
      name: formData.get('name'),
      description: `${formData.get('name')} created from the local dashboard.`,
      orchestration: {
        mode: 'deterministic-graph',
        strategy: 'sequential',
        allowAgentDelegation: false,
        requireApprovalForSideEffects: true,
      },
      steps: state.workflowDraftSteps.map((agentId, index) => ({
        id: agentId.id,
        agent: agentId.agent,
        dependsOn: (agentId.dependsOn || []).filter((dependency) => dependency !== '__start'),
      })),
    });
    await loadWorkflows();
    renderCurrentApp();
    showMessage(elements, 'Workflow saved with guardrails enabled.');
  });
}

async function saveKbSourceForm(event) {
  event.preventDefault();
  await withUiError(async () => {
    const formData = new FormData(elements.kbSourceForm);
    await saveKbSource({
      id: formData.get('id'),
      name: formData.get('name'),
      type: formData.get('type'),
      url: formData.get('url'),
    });
    await loadKbSources();
    renderCurrentApp();
    showMessage(elements, 'KB source saved.');
  });
}

async function selectRun(runId) {
  const run = await fetchRun(runId);
  state.selectedRun = run;
  renderCurrentApp();
  showCurrentRun();
}

async function searchKb(event) {
  event.preventDefault();
  await withUiError(async () => {
    const formData = new FormData(elements.kbForm);
    const data = await searchKnowledgeBase(formData.get('query'));
    renderKbResults(elements, data.results || []);
  });
}

function addWorkflowStep() {
  const agentId = elements.workflowAgentSelect.value;
  if (!agentId) return;
  addDraftStep(agentId);
  renderCurrentApp();
}

function allowAgentDrop(event) {
  if (!Array.from(event.dataTransfer.types).includes('application/x-agent-id')) return;
  event.preventDefault();
  elements.workflowMap.classList.add('drop-ready');
}

function clearAgentDropState(event) {
  if (elements.workflowMap.contains(event.relatedTarget)) return;
  elements.workflowMap.classList.remove('drop-ready');
}

function dropAgentOnCanvas(event) {
  const agentId = event.dataTransfer.getData('application/x-agent-id');
  if (!agentId) return;
  event.preventDefault();
  elements.workflowMap.classList.remove('drop-ready');

  const nextSteps = [...state.workflowDraftSteps, createDraftStep(agentId)];
  const stepId = nextSteps.at(-1).id;
  rememberDroppedNodePosition(stepId, event);
  state.workflowDraftSteps = nextSteps;
  state.selectedWorkflowStepId = stepId;
  renderCurrentApp();
  showMessage(elements, `Added ${agentId}. Create connections manually when ready.`);
}

function moveWorkflowStep(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.workflowDraftSteps.length) return;
  const steps = [...state.workflowDraftSteps];
  [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
  state.workflowDraftSteps = steps;
  renderCurrentApp();
}

function removeWorkflowStep(index) {
  const removed = state.workflowDraftSteps[index];
  state.workflowDraftSteps = state.workflowDraftSteps
    .filter((_, itemIndex) => itemIndex !== index)
    .map((step) => ({
      ...step,
      dependsOn: (step.dependsOn || []).filter((dependency) => dependency !== removed?.id),
    }));
  if (state.selectedWorkflowStepId === removed?.id) {
    state.selectedWorkflowStepId = null;
  }
  renderCurrentApp();
}

async function approveSelectedRun(runId) {
  await withUiError(async () => {
    state.selectedRun = await approveRun(runId);
    await loadRuns();
    renderCurrentApp();
    showCurrentRun();
    showMessage(elements, 'Run approved for side-effect actions.');
  });
}

async function rerunSelectedStep(runId, stepId) {
  await withUiError(async () => {
    state.selectedRun = await rerunStep(runId, stepId);
    await loadRuns();
    renderCurrentApp();
    showCurrentRun();
    showMessage(elements, `Step rerun completed: ${stepId}`);
  });
}

function showCurrentRun() {
  showRun(elements, state.selectedRun, {
    onApprove: approveSelectedRun,
    onRerunStep: rerunSelectedStep,
  });
}

function renderCurrentApp() {
  renderApp({
    state,
    elements,
    onRunSelected: selectRun,
    onWorkflowStepMove: moveWorkflowStep,
    onWorkflowStepRemove: removeWorkflowStep,
    onWorkflowStepSelected: selectWorkflowStep,
    onWorkflowConnectionCreate: toggleWorkflowConnection,
  });
  attachAgentPaletteDrag();
}

function syncDraftFromWorkflow() {
  const workflow = state.workflows.find((item) => item.id === elements.workflowForm.elements.id.value) || state.workflows[0];
  if (workflow?.steps?.length) {
    state.workflowDraftSteps = workflow.steps.map((step, index) => ({
      id: step.id,
      agent: step.agent,
      dependsOn: step.dependsOn || (index === 0 ? [] : [workflow.steps[index - 1].id]),
    }));
    state.selectedWorkflowStepId = state.workflowDraftSteps[0]?.id || null;
  }
}

async function withUiError(action) {
  try {
    await action();
  } catch (error) {
    showMessage(elements, cleanError(error), 'error');
  }
}

function cleanError(error) {
  try {
    return JSON.parse(error.message).error || error.message;
  } catch {
    return error.message;
  }
}

function uniqueStepId(agentId, index) {
  return uniqueStepIdFor(state.workflowDraftSteps.map((step) => step.agent), agentId, index);
}

function uniqueStepIdFor(steps, agentId, index) {
  const priorCount = steps.slice(0, index).filter((item) => item === agentId).length;
  return priorCount === 0 ? agentId : `${agentId}-${priorCount + 1}`;
}

function attachAgentPaletteDrag() {
  for (const item of elements.workflowAgentList?.querySelectorAll('[data-drag-agent-id]') || []) {
    item.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('application/x-agent-id', item.dataset.dragAgentId);
      event.dataTransfer.effectAllowed = 'copy';
      item.classList.add('dragging-agent');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging-agent');
      elements.workflowMap.classList.remove('drop-ready');
    });
  }
}

function rememberDroppedNodePosition(stepId, event) {
  const board = elements.workflowMap.querySelector('.flow-board');
  if (!board) return;

  const boardRect = board.getBoundingClientRect();
  const x = Math.max(24, event.clientX - boardRect.left - 130);
  const y = Math.max(24, event.clientY - boardRect.top - 72);
  const key = `developer-ai-fabric.canvas.${currentWorkflowId()}`;
  let positions = {};
  try {
    positions = JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    positions = {};
  }
  positions[stepId] = { x, y };
  localStorage.setItem(key, JSON.stringify(positions));
}

function currentWorkflowId() {
  return elements.workflowForm?.elements?.id?.value || state.workflows[0]?.id || 'agentic-workflow';
}

function addDraftStep(agentId) {
  const step = createDraftStep(agentId);
  state.workflowDraftSteps = [...state.workflowDraftSteps, step];
  state.selectedWorkflowStepId = step.id;
}

function createDraftStep(agentId) {
  const index = state.workflowDraftSteps.length;
  const id = uniqueStepIdFor(
    [...state.workflowDraftSteps.map((step) => step.agent), agentId],
    agentId,
    index,
  );
  return {
    id,
    agent: agentId,
    dependsOn: [],
  };
}

function selectWorkflowStep(stepId) {
  state.selectedWorkflowStepId = stepId === '__start' ? null : stepId;
  renderCurrentApp();
}

function toggleWorkflowConnection(sourceStepId, targetStepId) {
  if (!sourceStepId || !targetStepId || sourceStepId === targetStepId) return;
  if (sourceStepId === '__start') {
    state.workflowDraftSteps = state.workflowDraftSteps.map((step) => (
      step.id === targetStepId ? { ...step, dependsOn: ['__start'] } : step
    ));
    state.selectedWorkflowStepId = targetStepId;
    renderCurrentApp();
    showMessage(elements, `Connected Start to ${targetStepId}.`);
    return;
  }
  let removed = false;
  state.workflowDraftSteps = state.workflowDraftSteps.map((step) => {
    if (step.id !== targetStepId) return step;
    const dependencies = new Set(step.dependsOn || []);
    if (dependencies.has(sourceStepId)) {
      dependencies.delete(sourceStepId);
      removed = true;
    } else {
      dependencies.add(sourceStepId);
    }
    return {
      ...step,
      dependsOn: Array.from(dependencies),
    };
  });
  state.selectedWorkflowStepId = targetStepId;
  renderCurrentApp();
  showMessage(
    elements,
    `${removed ? 'Removed connection' : 'Connected'} ${sourceStepId} ${removed ? 'from' : 'to'} ${targetStepId}.`,
  );
}

function validateWorkflowDraft() {
  if (state.workflowDraftSteps.length === 0) {
    throw new Error('Workflow must include at least one step.');
  }
  const stepIds = new Set(state.workflowDraftSteps.map((step) => step.id));
  for (const step of state.workflowDraftSteps) {
    for (const dependency of step.dependsOn || []) {
      if (dependency !== '__start' && !stepIds.has(dependency)) {
        throw new Error(`Unknown dependency: ${dependency}`);
      }
      if (dependency === step.id) {
        throw new Error(`Step cannot depend on itself: ${step.id}`);
      }
    }
  }
  if (hasCycle(state.workflowDraftSteps)) {
    throw new Error('Workflow dependency graph contains a cycle.');
  }
}

function hasCycle(steps) {
  const stepIds = new Set(steps.map((step) => step.id));
  const indegree = new Map(steps.map((step) => [step.id, 0]));
  const childrenByDependency = new Map();
  for (const step of steps) {
    for (const dependency of step.dependsOn || []) {
      if (dependency === '__start' || !stepIds.has(dependency)) continue;
      indegree.set(step.id, indegree.get(step.id) + 1);
      childrenByDependency.set(dependency, [...(childrenByDependency.get(dependency) || []), step.id]);
    }
  }
  const ready = [...indegree.entries()].filter(([, count]) => count === 0).map(([stepId]) => stepId);
  let visited = 0;
  while (ready.length > 0) {
    const stepId = ready.shift();
    visited += 1;
    for (const child of childrenByDependency.get(stepId) || []) {
      const nextCount = indegree.get(child) - 1;
      indegree.set(child, nextCount);
      if (nextCount === 0) ready.push(child);
    }
  }
  return visited !== steps.length;
}

function csvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

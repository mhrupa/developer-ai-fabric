import { initializeCanvasInteractions } from './canvas.js';
import { escapeHtml, nodeInitials } from './utils.js';

export function renderApp({ state, elements, onRunSelected }) {
  elements.agentCount.textContent = state.agents.length;
  elements.workflowCount.textContent = state.workflows.length;
  elements.runCount.textContent = state.runs.length;
  renderAgents(state, elements);
  renderWorkflows(state, elements);
  renderRuns(state, elements, onRunSelected);
}

export function showView(state, elements, viewId) {
  state.activeView = viewId;
  for (const view of elements.views) {
    view.classList.toggle('active-view', view.id === viewId);
  }
  for (const button of elements.viewButtons) {
    button.classList.toggle('active', button.dataset.viewTarget === viewId);
  }
}

export function renderKbResults(elements, results) {
  elements.kbResults.innerHTML = (results || [])
    .map(
      (result) => `
        <article class="rca-block">
          <strong>${escapeHtml(result.title)}</strong>
          <p class="small">${escapeHtml(result.source)} - confidence ${escapeHtml(result.confidence)}</p>
          <p>${escapeHtml(result.summary)}</p>
        </article>
      `,
    )
    .join('');
}

export function showRun(elements, run) {
  elements.runDetail.classList.remove('hidden');
  elements.selectedRunId.textContent = run.runId;
  elements.timeline.innerHTML = (run.steps || [])
    .map(
      (step) => `
        <div class="timeline-item">
          <strong>${escapeHtml(step.agentName || step.agent)}</strong>
          <span class="small">${escapeHtml(step.status)} - ${escapeHtml(step.id)}</span>
          <p>${escapeHtml(step.output?.summary || step.output?.readiness || 'Step completed.')}</p>
        </div>
      `,
    )
    .join('');

  const result = run.result || {};
  elements.rcaOutput.innerHTML = `
    <div class="rca-block">
      <strong>Summary</strong>
      <p>${escapeHtml(result.summary || '')}</p>
    </div>
    <div class="rca-block">
      <strong>Suspected Root Cause</strong>
      <p>${escapeHtml(result.suspectedRootCause || '')}</p>
    </div>
    <div class="rca-block">
      <strong>Confidence</strong>
      <p>${escapeHtml(result.confidence || 'unknown')}</p>
    </div>
    <div class="rca-block">
      <strong>Evidence</strong>
      ${(result.evidence || []).map((item) => `<p>${escapeHtml(item.source)}: ${escapeHtml(item.summary)}</p>`).join('') || '<p>No evidence recorded.</p>'}
    </div>
    <div class="rca-block">
      <strong>Open Questions</strong>
      ${(result.openQuestions || []).map((item) => `<p>${escapeHtml(item)}</p>`).join('') || '<p>None.</p>'}
    </div>
  `;
  elements.runDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAgents(state, elements) {
  elements.agentGrid.innerHTML = state.agents
    .map(
      (agent) => `
        <article class="agent-card">
          <div>
            <h3>${escapeHtml(agent.name)}</h3>
            <p>${escapeHtml(agent.id)} v${escapeHtml(agent.version || '0.0.0')}</p>
          </div>
          <p>${escapeHtml(agent.description || '')}</p>
          <div class="tag-row">
            ${(agent.tools || []).slice(0, 3).map((tool) => `<span class="tag">${escapeHtml(tool)}</span>`).join('')}
          </div>
        </article>
      `,
    )
    .join('');
}

function renderWorkflows(state, elements) {
  const agentById = new Map(state.agents.map((agent) => [agent.id, agent]));
  state.activeWorkflowId = state.workflows[0]?.id || null;
  elements.workflowMap.innerHTML = state.workflows
    .map((workflow) => renderWorkflowCanvas(workflow, agentById))
    .join('');

  for (const node of elements.workflowMap.querySelectorAll('[data-agent-id]')) {
    node.addEventListener('click', () => {
      const agent = agentById.get(node.dataset.agentId);
      const step = node.dataset.stepId;
      for (const item of elements.workflowMap.querySelectorAll('.flow-node')) {
        item.classList.toggle('selected', item === node);
      }
      renderInspector(elements, agent, step);
    });
  }

  const resetCanvasLayout = initializeCanvasInteractions({
    workflowMap: elements.workflowMap,
    activeWorkflowId: () => state.activeWorkflowId,
    renderWorkflows: () => renderWorkflows(state, elements),
  });
  elements.resetLayoutButton.onclick = resetCanvasLayout;
}

function renderWorkflowCanvas(workflow, agentById) {
  const steps = workflow.steps || [];
  const nodeWidth = 210;
  const nodes = [];

  for (const [index, step] of steps.entries()) {
    const agent = agentById.get(step.agent);

    nodes.push(`
      <button class="flow-node" data-index="${index}" data-step-id="${escapeHtml(step.id)}" data-agent-id="${escapeHtml(step.agent)}">
        <span class="node-port in"></span>
        <span class="node-port out"></span>
        <span class="flow-node-header">
          <span class="node-icon">${escapeHtml(nodeInitials(agent?.name || step.agent))}</span>
          <span>
            <strong>${escapeHtml(agent?.name || step.agent)}</strong>
            <span>${escapeHtml(step.id)}</span>
          </span>
        </span>
        <span>${escapeHtml(agent?.description || 'Agent metadata not found.')}</span>
      </button>
    `);
  }

  const width = Math.max(1120, 44 + steps.length * (nodeWidth + 72));
  return `
    <div class="flow-board" data-workflow-id="${escapeHtml(workflow.id)}" style="width: ${width}px;">
      <svg class="flow-lines" viewBox="0 0 ${width} 520" preserveAspectRatio="none"></svg>
      ${nodes.join('')}
    </div>
  `;
}

function renderInspector(elements, agent, stepId) {
  if (!agent) {
    elements.nodeInspector.innerHTML = `
      <h3>${escapeHtml(stepId)}</h3>
      <p class="small">Agent metadata was not found for this workflow step.</p>
    `;
    return;
  }

  elements.nodeInspector.innerHTML = `
    <h3>${escapeHtml(agent.name)}</h3>
    <p class="small">${escapeHtml(agent.id)} v${escapeHtml(agent.version || '0.0.0')}</p>
    <p>${escapeHtml(agent.description || '')}</p>
    <div class="inspector-section">
      <strong>Model policy</strong>
      <div class="tag-row">
        <span class="tag">${escapeHtml(agent.modelPolicy?.defaultTask || 'not-set')}</span>
        <span class="tag">local: ${escapeHtml(agent.modelPolicy?.allowLocal ?? 'n/a')}</span>
        <span class="tag">cloud: ${escapeHtml(agent.modelPolicy?.allowCloud ?? 'n/a')}</span>
      </div>
    </div>
    <div class="inspector-section">
      <strong>Tools</strong>
      <div class="tag-row">
        ${(agent.tools || []).map((tool) => `<span class="tag">${escapeHtml(tool)}</span>`).join('') || '<span class="tag">none</span>'}
      </div>
    </div>
    <div class="inspector-section">
      <strong>Outputs</strong>
      <div class="tag-row">
        ${(agent.outputs || []).map((output) => `<span class="tag">${escapeHtml(output)}</span>`).join('') || '<span class="tag">none</span>'}
      </div>
    </div>
  `;
}

function renderRuns(state, elements, onRunSelected) {
  if (state.runs.length === 0) {
    elements.runsList.innerHTML = '<p class="small">No runs yet.</p>';
    return;
  }

  elements.runsList.innerHTML = state.runs
    .map(
      (run) => `
        <button class="run-item" data-run-id="${escapeHtml(run.runId)}">
          <strong>${escapeHtml(run.issueKey || run.runId)}</strong>
          <span class="run-meta">${escapeHtml(run.service || 'unknown service')} - ${escapeHtml(run.status)}</span>
        </button>
      `,
    )
    .join('');

  for (const button of elements.runsList.querySelectorAll('[data-run-id]')) {
    button.addEventListener('click', () => onRunSelected(button.dataset.runId));
  }
}

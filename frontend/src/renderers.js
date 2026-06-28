import { initializeCanvasInteractions } from './canvas.js';
import { escapeHtml, nodeInitials } from './utils.js';

export function renderApp({
  state,
  elements,
  onRunSelected,
  onWorkflowStepMove,
  onWorkflowStepRemove,
  onWorkflowStepSelected,
  onWorkflowConnectionCreate,
}) {
  elements.agentCount.textContent = state.agents.length;
  elements.workflowCount.textContent = state.workflows.length;
  elements.runCount.textContent = state.runs.length;
  renderSkills(state, elements);
  renderKbSources(state, elements);
  renderAgents(state, elements);
  renderWorkflowDraft(state, elements, onWorkflowStepMove, onWorkflowStepRemove, onWorkflowStepSelected);
  renderWorkflows(state, elements, onWorkflowStepSelected, onWorkflowConnectionCreate);
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

export function showRun(elements, run, actions = {}) {
  elements.runDetail.classList.remove('hidden');
  elements.selectedRunId.textContent = run.runId;
  elements.timeline.innerHTML = (run.steps || [])
    .map(
      (step) => `
        <div class="timeline-item">
          <strong>${escapeHtml(step.agentName || step.agent)}</strong>
          <span class="small">${escapeHtml(step.status)} - ${escapeHtml(step.id)}</span>
          <p>${escapeHtml(step.output?.summary || step.output?.readiness || 'Step completed.')}</p>
          <button class="secondary-button compact-button" data-rerun-step="${escapeHtml(step.id)}" type="button">Rerun Step</button>
        </div>
      `,
    )
    .join('');

  const approval = run.approval || {};
  elements.runActions.innerHTML = `
    <div class="approval-strip ${approval.status === 'approved' ? 'approved' : ''}">
      <div>
        <strong>Approval ${escapeHtml(approval.status || 'pending')}</strong>
        <span>Required before side-effect actions such as posting back to Jira.</span>
      </div>
      <button id="approve-run-button" class="secondary-button" type="button" ${approval.status === 'approved' ? 'disabled' : ''}>Approve</button>
    </div>
  `;

  elements.runActions.querySelector('#approve-run-button')?.addEventListener('click', () => actions.onApprove?.(run.runId));
  for (const button of elements.timeline.querySelectorAll('[data-rerun-step]')) {
    button.addEventListener('click', () => actions.onRerunStep?.(run.runId, button.dataset.rerunStep));
  }

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

export function showMessage(elements, message, tone = 'info') {
  elements.appMessage.textContent = message;
  elements.appMessage.className = `app-message ${tone}`;
  window.setTimeout(() => {
    elements.appMessage.classList.add('hidden');
  }, 5000);
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

function renderSkills(state, elements) {
  if (!elements.skillList) return;
  if (state.skills.length === 0) {
    elements.skillList.innerHTML = `
      <div class="empty-state">
        <strong>No local skills yet</strong>
        <span>Saved skills will appear here.</span>
      </div>
    `;
    return;
  }

  elements.skillList.innerHTML = state.skills
    .map(
      (skill) => `
        <article class="registry-item">
          <strong>${escapeHtml(skill.name)}</strong>
          <span>${escapeHtml(skill.id)} - ${escapeHtml(skill.toolBinding || 'no tool binding')}</span>
        </article>
      `,
    )
    .join('');
}

function renderKbSources(state, elements) {
  if (!elements.kbSourceList) return;
  if (state.kbSources.length === 0) {
    elements.kbSourceList.innerHTML = '<p class="small">No KB sources configured yet.</p>';
    return;
  }

  elements.kbSourceList.innerHTML = state.kbSources
    .map(
      (source) => `
        <article class="registry-item">
          <strong>${escapeHtml(source.name)}</strong>
          <span>${escapeHtml(source.type)} - ${escapeHtml(source.url)}</span>
        </article>
      `,
    )
    .join('');
}

function renderWorkflowDraft(state, elements, onWorkflowStepMove, onWorkflowStepRemove, onWorkflowStepSelected) {
  if (!elements.workflowAgentSelect || !elements.workflowStepList) return;

  elements.workflowAgentSelect.innerHTML = state.agents
    .map((agent) => `<option value="${escapeHtml(agent.id)}">${escapeHtml(agent.name)} (${escapeHtml(agent.id)})</option>`)
    .join('');

  if (elements.workflowAgentList) {
    elements.workflowAgentList.innerHTML = state.agents
      .map(
        (agent) => `
          <button class="agent-palette-item" draggable="true" data-drag-agent-id="${escapeHtml(agent.id)}" type="button">
            <span class="palette-agent-icon">${escapeHtml(nodeInitials(agent.name || agent.id))}</span>
            <span>
              <strong>${escapeHtml(agent.name || agent.id)}</strong>
              <em>${escapeHtml(agent.modelPolicy?.defaultTask || 'agent')}</em>
            </span>
          </button>
        `,
      )
      .join('');
  }

  if (state.workflowDraftSteps.length === 0) {
    elements.workflowStepList.innerHTML = `
      <div class="empty-state compact-empty">
        <strong>No steps added</strong>
        <span>Add at least one agent step before saving.</span>
      </div>
    `;
    return;
  }

  const agentById = new Map(state.agents.map((agent) => [agent.id, agent]));
  elements.workflowStepList.innerHTML = state.workflowDraftSteps
    .map((step, index) => {
      const agent = agentById.get(step.agent);
      const parentLabel = step.dependsOn?.length
        ? `child of ${step.dependsOn.map((dependency) => (dependency === '__start' ? 'Start' : dependency)).join(', ')}`
        : 'unconnected';
      const selected = step.id === state.selectedWorkflowStepId ? ' selected-step' : '';
      return `
        <div class="workflow-step-row${selected}" data-select-step="${escapeHtml(step.id)}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(agent?.name || step.agent)}</strong>
          <em>${escapeHtml(parentLabel)}</em>
          <button class="secondary-button compact-button" data-step-move="${index}" data-direction="-1" type="button">Up</button>
          <button class="secondary-button compact-button" data-step-move="${index}" data-direction="1" type="button">Down</button>
          <button class="secondary-button compact-button danger-button" data-step-remove="${index}" type="button">Remove</button>
        </div>
      `;
    })
    .join('');

  for (const button of elements.workflowStepList.querySelectorAll('[data-step-move]')) {
    button.addEventListener('click', () => onWorkflowStepMove?.(Number(button.dataset.stepMove), Number(button.dataset.direction)));
  }
  for (const button of elements.workflowStepList.querySelectorAll('[data-step-remove]')) {
    button.addEventListener('click', () => onWorkflowStepRemove?.(Number(button.dataset.stepRemove)));
  }
  for (const row of elements.workflowStepList.querySelectorAll('[data-select-step]')) {
    row.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      onWorkflowStepSelected?.(row.dataset.selectStep);
    });
  }
}

function renderWorkflows(state, elements, onWorkflowStepSelected, onWorkflowConnectionCreate) {
  const agentById = new Map(state.agents.map((agent) => [agent.id, agent]));
  const workflow = draftWorkflow(state, elements);
  state.activeWorkflowId = workflow.id;
  elements.workflowMap.innerHTML = renderWorkflowCanvas(workflow, agentById);

  for (const node of elements.workflowMap.querySelectorAll('[data-agent-id]')) {
    node.addEventListener('click', () => {
      if (node.dataset.agentId === '__start') {
        for (const item of elements.workflowMap.querySelectorAll('.flow-node')) {
          item.classList.toggle('selected', item === node);
        }
        onWorkflowStepSelected?.('__start');
        renderStartInspector(elements);
        return;
      }
      const agent = agentById.get(node.dataset.agentId);
      const step = node.dataset.stepId;
      for (const item of elements.workflowMap.querySelectorAll('.flow-node')) {
        item.classList.toggle('selected', item === node);
      }
      onWorkflowStepSelected?.(step);
      renderInspector(elements, agent, step);
    });
  }

  const resetCanvasLayout = initializeCanvasInteractions({
    workflowMap: elements.workflowMap,
    activeWorkflowId: () => state.activeWorkflowId,
    renderWorkflows: () => renderWorkflows(state, elements, onWorkflowStepSelected, onWorkflowConnectionCreate),
    onConnectionCreate: onWorkflowConnectionCreate,
  });
  elements.resetLayoutButton.onclick = resetCanvasLayout;
}

function renderStartInspector(elements) {
  elements.nodeInspector.innerHTML = `
    <h3>Start</h3>
    <p class="small">Entry point for the local agent orchestrator.</p>
    <div class="inspector-section">
      <strong>Guardrails</strong>
      <div class="tag-row">
        <span class="tag">approval required</span>
        <span class="tag">local execution</span>
      </div>
    </div>
  `;
}

function renderWorkflowCanvas(workflow, agentById) {
  const steps = workflow.steps || [];
  const nodeWidth = 260;
  const startHasOutput = steps.some((step) => (step.dependsOn || []).includes('__start'));
  const nodes = [
    `
      <button class="flow-node start-flow-node${startHasOutput ? ' has-output' : ''}" data-index="-1" data-step-id="__start" data-agent-id="__start" type="button">
        <span class="node-port out"></span>
        <span class="start-play">▶</span>
        <strong>Start</strong>
      </button>
    `,
  ];

  for (const [index, step] of steps.entries()) {
    const agent = agentById.get(step.agent);
    const nodeTone = index === 0 ? 'intent-node' : 'agent-node';
    const selected = step.id === workflow.selectedStepId ? ' selected' : '';
    const hasInput = (step.dependsOn || []).length > 0 ? ' has-input' : '';
    const hasOutput = steps.some((item) => (item.dependsOn || []).includes(step.id)) ? ' has-output' : '';

    nodes.push(`
      <button class="flow-node ${nodeTone}${selected}${hasInput}${hasOutput}" data-index="${index}" data-step-id="${escapeHtml(step.id)}" data-agent-id="${escapeHtml(step.agent)}" data-depends-on="${escapeHtml((step.dependsOn || []).join(','))}" type="button">
        <span class="node-port in"></span>
        <span class="node-port out"></span>
        <span class="flow-node-header">
          <span class="node-icon">${escapeHtml(nodeInitials(agent?.name || step.agent))}</span>
          <span>
            <strong>${escapeHtml(agent?.name || step.agent)}</strong>
            <span class="model-pill">${escapeHtml(agent?.modelPolicy?.defaultTask || step.id)}</span>
          </span>
        </span>
      </button>
    `);
  }

  const width = Math.max(1280, 44 + (steps.length + 1) * (nodeWidth + 110));
  return `
    <div class="flow-board" data-workflow-id="${escapeHtml(workflow.id)}" style="width: ${width}px;">
      <svg class="flow-lines" viewBox="0 0 ${width} 690" preserveAspectRatio="none"></svg>
      ${nodes.join('')}
    </div>
  `;
}

function draftWorkflow(state, elements) {
  const form = elements.workflowForm;
  const name = form?.elements?.name?.value || state.workflows[0]?.name || 'Agentic Workflow';
  const id = form?.elements?.id?.value || state.workflows[0]?.id || 'agentic-workflow';
  return {
    id,
    name,
    steps: state.workflowDraftSteps,
    selectedStepId: state.selectedWorkflowStepId,
  };
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

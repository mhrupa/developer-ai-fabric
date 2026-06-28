import { clamp } from './utils.js';

export function initializeCanvasInteractions({ workflowMap, activeWorkflowId, renderWorkflows, onConnectionCreate }) {
  for (const board of workflowMap.querySelectorAll('.flow-board')) {
    const positions = loadNodePositions(board);
    const nodes = Array.from(board.querySelectorAll('.flow-node'));

    for (const node of nodes) {
      const position = positions[node.dataset.stepId] || defaultNodePosition(Number(node.dataset.index));
      setNodePosition(node, position);
      node.addEventListener('pointerdown', (event) => startNodeDrag(event, board, node));
    }
    for (const port of board.querySelectorAll('.node-port.out')) {
      port.addEventListener('pointerdown', (event) => startConnectionDrag(event, board, port, onConnectionCreate));
    }

    drawCanvasEdges(board);
  }

  return function resetCanvasLayout() {
    if (!activeWorkflowId()) return;
    localStorage.removeItem(canvasStorageKey(activeWorkflowId()));
    renderWorkflows();
  };
}

function startNodeDrag(event, board, node) {
  if (event.button !== 0) return;
  if (event.target.closest('.node-port')) return;
  node.setPointerCapture(event.pointerId);

  const boardRect = board.getBoundingClientRect();
  const start = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    nodeX: Number(node.dataset.x || 0),
    nodeY: Number(node.dataset.y || 0),
  };
  let dragging = false;

  const moveNode = (moveEvent) => {
    const deltaX = moveEvent.clientX - start.pointerX;
    const deltaY = moveEvent.clientY - start.pointerY;
    if (!dragging && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }
    dragging = true;
    node.classList.add('dragging');
    const next = {
      x: clamp(start.nodeX + deltaX, 20, boardRect.width - node.offsetWidth - 20),
      y: clamp(start.nodeY + deltaY, 20, boardRect.height - node.offsetHeight - 20),
    };
    setNodePosition(node, next);
    drawCanvasEdges(board);
  };

  const stopDrag = () => {
    node.classList.remove('dragging');
    node.removeEventListener('pointermove', moveNode);
    node.removeEventListener('pointerup', stopDrag);
    node.removeEventListener('pointercancel', stopDrag);
    if (dragging) {
      saveNodePositions(board);
    }
  };

  node.addEventListener('pointermove', moveNode);
  node.addEventListener('pointerup', stopDrag);
  node.addEventListener('pointercancel', stopDrag);
}

function startConnectionDrag(event, board, port, onConnectionCreate) {
  if (event.button !== 0) return;
  const sourceNode = port.closest('.flow-node');
  if (!sourceNode) return;
  event.preventDefault();
  event.stopPropagation();
  port.setPointerCapture(event.pointerId);
  board.classList.add('linking');
  sourceNode.classList.add('connection-source');

  const svg = board.querySelector('.flow-lines');
  const source = portCenter(board, port);
  const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  preview.setAttribute('class', 'flow-line preview-line');
  svg.append(preview);

  const moveLink = (moveEvent) => {
    const target = pointFromEvent(board, moveEvent);
    const hoverNode = connectionTargetFromPoint(moveEvent.clientX, moveEvent.clientY, sourceNode);
    highlightConnectionTarget(board, hoverNode);
    preview.setAttribute('d', curvePath(source, target));
  };

  const stopLink = (upEvent) => {
    const targetNode = connectionTargetFromPoint(upEvent.clientX, upEvent.clientY, sourceNode);
    preview.remove();
    board.classList.remove('linking');
    sourceNode.classList.remove('connection-source');
    highlightConnectionTarget(board, null);
    port.removeEventListener('pointermove', moveLink);
    port.removeEventListener('pointerup', stopLink);
    port.removeEventListener('pointercancel', stopLink);
    if (targetNode) {
      onConnectionCreate?.(sourceNode.dataset.stepId, targetNode.dataset.stepId);
    }
  };

  port.addEventListener('pointermove', moveLink);
  port.addEventListener('pointerup', stopLink);
  port.addEventListener('pointercancel', stopLink);
}

function drawCanvasEdges(board) {
  const svg = board.querySelector('.flow-lines');
  const nodes = Array.from(board.querySelectorAll('.flow-node'));
  const nodeById = new Map(nodes.map((node) => [node.dataset.stepId, node]));
  const paths = [];

  for (const current of nodes.filter((node) => node.dataset.stepId !== '__start')) {
    const dependencies = (current.dataset.dependsOn || '').split(',').filter(Boolean);

    for (const parentId of dependencies) {
      const previous = nodeById.get(parentId);
      if (!previous) continue;

      const outputPort = previous.querySelector('.node-port.out');
      const inputPort = current.querySelector('.node-port.in');
      if (!outputPort || !inputPort) continue;

      const start = portCenter(board, outputPort);
      const end = portCenter(board, inputPort);
      paths.push(
        `<path class="flow-line" d="${curvePath(start, end)}" />`,
      );
    }
  }

  svg.innerHTML = paths.join('');
}

function portCenter(board, port) {
  const boardRect = board.getBoundingClientRect();
  const rect = port.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - boardRect.left,
    y: rect.top + rect.height / 2 - boardRect.top,
  };
}

function pointFromEvent(board, event) {
  const boardRect = board.getBoundingClientRect();
  return {
    x: event.clientX - boardRect.left,
    y: event.clientY - boardRect.top,
  };
}

function connectionTargetFromPoint(clientX, clientY, sourceNode) {
  const element = document.elementFromPoint(clientX, clientY);
  const target = element?.closest?.('.flow-node');
  if (!target || target === sourceNode || target.dataset.stepId === '__start') {
    return null;
  }
  return target;
}

function highlightConnectionTarget(board, targetNode) {
  for (const node of board.querySelectorAll('.flow-node')) {
    node.classList.toggle('connection-target', node === targetNode);
  }
}

function curvePath(start, end) {
  const mid = start.x + (end.x - start.x) / 2;
  return `M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`;
}

function setNodePosition(node, position) {
  node.dataset.x = String(position.x);
  node.dataset.y = String(position.y);
  node.style.left = `${position.x}px`;
  node.style.top = `${position.y}px`;
}

function defaultNodePosition(index) {
  if (index < 0) {
    return {
      x: 44,
      y: 210,
    };
  }

  return {
    x: 360 + index * 310,
    y: 150 + (index % 3) * 118,
  };
}

function loadNodePositions(board) {
  try {
    return JSON.parse(localStorage.getItem(canvasStorageKey(board.dataset.workflowId)) || '{}');
  } catch {
    return {};
  }
}

function saveNodePositions(board) {
  const positions = {};
  for (const node of board.querySelectorAll('.flow-node')) {
    positions[node.dataset.stepId] = {
      x: Number(node.dataset.x),
      y: Number(node.dataset.y),
    };
  }
  localStorage.setItem(canvasStorageKey(board.dataset.workflowId), JSON.stringify(positions));
}

function canvasStorageKey(workflowId) {
  return `developer-ai-fabric.canvas.${workflowId}`;
}

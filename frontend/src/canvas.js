import { clamp } from './utils.js';

export function initializeCanvasInteractions({ workflowMap, activeWorkflowId, renderWorkflows }) {
  for (const board of workflowMap.querySelectorAll('.flow-board')) {
    const positions = loadNodePositions(board);
    const nodes = Array.from(board.querySelectorAll('.flow-node'));

    for (const node of nodes) {
      const position = positions[node.dataset.stepId] || defaultNodePosition(Number(node.dataset.index));
      setNodePosition(node, position);
      node.addEventListener('pointerdown', (event) => startNodeDrag(event, board, node));
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
  event.preventDefault();
  node.setPointerCapture(event.pointerId);
  node.classList.add('dragging');

  const boardRect = board.getBoundingClientRect();
  const start = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    nodeX: Number(node.dataset.x || 0),
    nodeY: Number(node.dataset.y || 0),
  };

  const moveNode = (moveEvent) => {
    const next = {
      x: clamp(start.nodeX + moveEvent.clientX - start.pointerX, 20, boardRect.width - node.offsetWidth - 20),
      y: clamp(start.nodeY + moveEvent.clientY - start.pointerY, 20, boardRect.height - node.offsetHeight - 20),
    };
    setNodePosition(node, next);
    drawCanvasEdges(board);
  };

  const stopDrag = () => {
    node.classList.remove('dragging');
    node.removeEventListener('pointermove', moveNode);
    node.removeEventListener('pointerup', stopDrag);
    node.removeEventListener('pointercancel', stopDrag);
    saveNodePositions(board);
  };

  node.addEventListener('pointermove', moveNode);
  node.addEventListener('pointerup', stopDrag);
  node.addEventListener('pointercancel', stopDrag);
}

function drawCanvasEdges(board) {
  const svg = board.querySelector('.flow-lines');
  const nodes = Array.from(board.querySelectorAll('.flow-node')).sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index),
  );
  const paths = [];

  for (let index = 1; index < nodes.length; index += 1) {
    const previous = nodes[index - 1];
    const current = nodes[index];
    const start = {
      x: Number(previous.dataset.x) + previous.offsetWidth,
      y: Number(previous.dataset.y) + previous.offsetHeight / 2,
    };
    const end = {
      x: Number(current.dataset.x),
      y: Number(current.dataset.y) + current.offsetHeight / 2,
    };
    const mid = start.x + (end.x - start.x) / 2;
    paths.push(
      `<path class="flow-line" d="M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}" />`,
    );
  }

  svg.innerHTML = paths.join('');
}

function setNodePosition(node, position) {
  node.dataset.x = String(position.x);
  node.dataset.y = String(position.y);
  node.style.left = `${position.x}px`;
  node.style.top = `${position.y}px`;
}

function defaultNodePosition(index) {
  return {
    x: 44 + index * (210 + 72),
    y: 180 + (index % 2 === 0 ? 0 : 96),
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

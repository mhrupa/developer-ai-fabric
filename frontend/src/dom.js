export function getElements() {
  return {
    viewButtons: document.querySelectorAll('[data-view-target]'),
    views: document.querySelectorAll('.app-view'),
    healthStatus: document.querySelector('#health-status'),
    statusDot: document.querySelector('.status-dot'),
    agentCount: document.querySelector('#agent-count'),
    workflowCount: document.querySelector('#workflow-count'),
    runCount: document.querySelector('#run-count'),
    agentGrid: document.querySelector('#agent-grid'),
    workflowMap: document.querySelector('#workflow-map'),
    nodeInspector: document.querySelector('#node-inspector'),
    resetLayoutButton: document.querySelector('#reset-layout-button'),
    runsList: document.querySelector('#runs-list'),
    runForm: document.querySelector('#run-form'),
    refreshButton: document.querySelector('#refresh-button'),
    runDetail: document.querySelector('#run-detail'),
    selectedRunId: document.querySelector('#selected-run-id'),
    timeline: document.querySelector('#timeline'),
    rcaOutput: document.querySelector('#rca-output'),
    kbForm: document.querySelector('#kb-form'),
    kbResults: document.querySelector('#kb-results'),
  };
}

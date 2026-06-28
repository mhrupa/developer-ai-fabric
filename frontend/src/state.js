export const state = {
  agents: [],
  workflows: [],
  skills: [],
  kbSources: [],
  runs: [],
  workflowDraftSteps: [
    { id: 'bug-intake', agent: 'bug-intake', dependsOn: [] },
    { id: 'service-resolver', agent: 'service-resolver', dependsOn: ['bug-intake'] },
    { id: 'kb-retriever', agent: 'kb-retriever', dependsOn: ['service-resolver'] },
    { id: 'rca-writer', agent: 'rca-writer', dependsOn: ['kb-retriever'] },
    { id: 'reviewer', agent: 'reviewer', dependsOn: ['rca-writer'] },
  ],
  selectedWorkflowStepId: null,
  selectedRun: null,
  activeWorkflowId: null,
  activeView: 'dashboard',
};

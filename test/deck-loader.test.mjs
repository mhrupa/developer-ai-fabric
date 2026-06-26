import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeckYaml } from '../service/deck-loader.mjs';

test('parses agent metadata with arrays and nested model policy', () => {
  const parsed = parseDeckYaml(`
id: bug-intake
name: Bug Intake Agent
modelPolicy:
  defaultTask: jira_summary
  allowLocal: true
tools:
  - jira-mcp
  - kb-api
outputs:
  - summary
`);

  assert.equal(parsed.id, 'bug-intake');
  assert.equal(parsed.name, 'Bug Intake Agent');
  assert.deepEqual(parsed.modelPolicy, {
    defaultTask: 'jira_summary',
    allowLocal: true,
  });
  assert.deepEqual(parsed.tools, ['jira-mcp', 'kb-api']);
  assert.deepEqual(parsed.outputs, ['summary']);
});

test('parses workflow steps', () => {
  const parsed = parseDeckYaml(`
id: rca-analysis
name: RCA Analysis
steps:
  - id: bug-intake
    agent: bug-intake
  - id: rca-writer
    agent: rca-writer
`);

  assert.deepEqual(parsed.steps, [
    { id: 'bug-intake', agent: 'bug-intake' },
    { id: 'rca-writer', agent: 'rca-writer' },
  ]);
});

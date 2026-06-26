import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RUNS_DIR = path.join(os.homedir(), '.developer-ai-fabric', 'runs');

export async function saveRun(run) {
  await fs.mkdir(RUNS_DIR, { recursive: true });
  await fs.writeFile(path.join(RUNS_DIR, `${run.runId}.json`), JSON.stringify(run, null, 2));
}

export async function getRun(runId) {
  try {
    const content = await fs.readFile(path.join(RUNS_DIR, `${runId}.json`), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function listRuns() {
  try {
    const files = await fs.readdir(RUNS_DIR);
    const runs = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => JSON.parse(await fs.readFile(path.join(RUNS_DIR, file), 'utf8'))),
    );
    return runs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((run) => ({
        runId: run.runId,
        workflow: run.workflow,
        status: run.status,
        issueKey: run.input?.jiraIssueKey,
        service: run.input?.service,
        createdAt: run.createdAt,
      }));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

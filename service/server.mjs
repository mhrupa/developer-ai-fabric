import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgents, loadWorkflows } from './deck-loader.mjs';
import { getRun, listRuns } from './run-store.mjs';
import { runWorkflow } from './workflow-runner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'ui');
const port = Number(process.env.PORT || 4173);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Developer AI Fabric UI: http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/v1/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'developer-ai-fabric-local',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/agents') {
    sendJson(response, 200, { agents: await loadAgents(rootDir) });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/workflows') {
    sendJson(response, 200, { workflows: await loadWorkflows(rootDir) });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/runs') {
    sendJson(response, 200, { runs: await listRuns() });
    return;
  }

  const runMatch = url.pathname.match(/^\/api\/v1\/runs\/([^/]+)$/);
  if (request.method === 'GET' && runMatch) {
    const run = await getRun(runMatch[1]);
    if (!run) {
      sendJson(response, 404, { error: 'Run not found' });
      return;
    }
    sendJson(response, 200, run);
    return;
  }

  const eventsMatch = url.pathname.match(/^\/api\/v1\/runs\/([^/]+)\/events$/);
  if (request.method === 'GET' && eventsMatch) {
    const run = await getRun(eventsMatch[1]);
    if (!run) {
      sendJson(response, 404, { error: 'Run not found' });
      return;
    }
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    for (const event of run.events || []) {
      response.write(`event: ${event.type}\n`);
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    response.end();
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/runs') {
    const body = await readJson(request);
    const [agents, workflows] = await Promise.all([loadAgents(rootDir), loadWorkflows(rootDir)]);
    const workflow = workflows.find((item) => item.id === body.workflow);

    if (!workflow) {
      sendJson(response, 404, { error: `Workflow not found: ${body.workflow}` });
      return;
    }

    const run = await runWorkflow({ workflow, agents, input: body.input || {} });
    sendJson(response, 201, run);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/kb/search') {
    const body = await readJson(request);
    sendJson(response, 200, {
      query: body.query || '',
      results: [
        {
          source: 'mock-kb',
          title: 'Remote KB client not configured yet',
          summary: 'This placeholder proves the UI and API contract before connecting the shared KB.',
          confidence: 'low',
        },
      ],
    });
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
}

async function serveStatic(response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(uiDir, safePath));

  if (!filePath.startsWith(uiDir)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, { 'content-type': contentType(filePath) });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const index = await fs.readFile(path.join(uiDir, 'index.html'));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(index);
      return;
    }
    throw error;
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, status, text) {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(text);
}

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'text/html; charset=utf-8';
}

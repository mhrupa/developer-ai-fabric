import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function loadAgents(rootDir = process.cwd()) {
  const agentsDir = path.join(rootDir, '.agent-deck', 'agents');
  return loadYamlDirectory(agentsDir, '.agent.yaml');
}

export async function loadWorkflows(rootDir = process.cwd()) {
  const workflowsDir = path.join(rootDir, '.agent-deck', 'workflows');
  return loadYamlDirectory(workflowsDir, '.workflow.yaml');
}

async function loadYamlDirectory(directory, suffix) {
  let files;
  try {
    files = await fs.readdir(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const documents = await Promise.all(
    files
      .filter((file) => file.endsWith(suffix))
      .sort()
      .map(async (file) => {
        const content = await fs.readFile(path.join(directory, file), 'utf8');
        return { ...parseDeckYaml(content), file };
      }),
  );

  return documents;
}

export function parseDeckYaml(content) {
  const result = {};
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let currentArrayKey = null;
  let currentObjectArrayKey = null;
  let currentObject = null;
  let currentNestedKey = null;

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue;

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();

    if (indent === 0) {
      currentArrayKey = null;
      currentObjectArrayKey = null;
      currentObject = null;
      currentNestedKey = null;

      const [key, value] = splitKeyValue(line);
      if (value === '') {
        result[key] = [];
        currentArrayKey = key;
      } else {
        result[key] = parseScalar(value);
      }
      continue;
    }

    if (indent === 2 && line.startsWith('- ') && currentArrayKey) {
      const item = line.slice(2).trim();
      if (item.includes(':')) {
        const [key, value] = splitKeyValue(item);
        currentObject = { [key]: parseScalar(value) };
        result[currentArrayKey].push(currentObject);
        currentObjectArrayKey = currentArrayKey;
      } else {
        result[currentArrayKey].push(parseScalar(item));
      }
      continue;
    }

    if (indent === 2 && currentArrayKey && !line.startsWith('- ')) {
      const [key, value] = splitKeyValue(line);
      if (Array.isArray(result[currentArrayKey])) {
        result[currentArrayKey] = {};
      }
      result[currentArrayKey][key] = value === '' ? [] : parseScalar(value);
      currentNestedKey = value === '' ? key : null;
      continue;
    }

    if (indent === 4 && currentObjectArrayKey && currentObject) {
      const [key, value] = splitKeyValue(line);
      currentObject[key] = parseScalar(value);
      continue;
    }

    if (indent === 4 && currentArrayKey && currentNestedKey && line.startsWith('- ')) {
      result[currentArrayKey][currentNestedKey].push(parseScalar(line.slice(2).trim()));
    }
  }

  return result;
}

function splitKeyValue(line) {
  const separator = line.indexOf(':');
  if (separator === -1) return [line, ''];
  return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^".*"$/.test(value)) return value.slice(1, -1);
  return value;
}

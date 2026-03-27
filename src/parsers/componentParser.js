import fs from 'fs-extra';
import path from 'path';

export async function parseComponents(componentsDir) {
  const entries = await fs.readdir(componentsDir, { withFileTypes: true });
  const componentDirs = entries.filter(e => e.isDirectory());

  const components = [];

  for (const dir of componentDirs) {
    const componentPath = path.join(componentsDir, dir.name);
    const component = await parseComponent(componentPath, dir.name);
    if (component) {
      components.push(component);
    }
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

async function parseComponent(componentPath, componentName) {
  const readmePath = path.join(componentPath, 'readme.md');
  const tsxPath = path.join(componentPath, `${componentName}.tsx`);

  let description = '';
  let usageContent = '';
  let props = [];
  let events = [];
  let cssParts = [];
  let cssProperties = [];

  if (await fs.pathExists(readmePath)) {
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    description = extractDescription(readmeContent);
    props = extractPropsFromTable(readmeContent);
    events = extractEventsFromTable(readmeContent);
  }

  const usageMdxPath = path.join(componentPath, 'Usage.mdx');
  if (await fs.pathExists(usageMdxPath)) {
    const usageMdxContent = await fs.readFile(usageMdxPath, 'utf-8');
    usageContent = parseUsageMdx(usageMdxContent);
  }

  if (await fs.pathExists(tsxPath)) {
    const tsxContent = await fs.readFile(tsxPath, 'utf-8');
    cssParts = extractCssParts(tsxContent);
    cssProperties = extractCssProperties(tsxContent);
  }

  return {
    name: componentName,
    displayName: toDisplayName(componentName),
    description,
    usageContent,
    props,
    events,
    cssParts,
    cssProperties
  };
}

function toDisplayName(name) {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function extractDescription(readmeContent) {
  const lines = readmeContent.split('\n');
  const descriptionLines = [];
  let inDescription = false;

  for (const line of lines) {
    if (line.startsWith('# ') && !inDescription) {
      inDescription = true;
      continue;
    }
    if (inDescription && (line.startsWith('##') || line.startsWith('```') || line.trim() === '')) {
      break;
    }
    if (inDescription) {
      descriptionLines.push(line);
    }
  }

  return descriptionLines.join(' ').trim();
}

function extractPropsFromTable(content) {
  const props = [];
  const headerTerms = ['Property', 'Attribute', 'Description', 'Type', 'Default'];
  const tableRegex = /^\| `([^`]+)` \s*\| `([^`]+)` \s*\| ([^|]+) \| `([^`]+)` \s*\| `([^`]+)` \s*\|$/gm;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    if (headerTerms.includes(match[1])) continue;
    props.push({
      name: match[1],
      attribute: match[2],
      description: match[3].trim(),
      type: match[4],
      default: match[5]
    });
  }
  return props;
}

function extractEventsFromTable(content) {
  const events = [];
  const headerTerms = ['Property', 'Attribute', 'Description', 'Type', 'Default', 'Event', 'Detail', 'Name'];
  const tableRegex = /^\| `(\w+)` \s*\| ([^|]+) \| `([^`]+)` \s*\|$/gm;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    if (headerTerms.includes(match[1])) continue;
    events.push({
      name: match[1],
      description: match[2].trim(),
      detail: match[3]
    });
  }
  return events;
}

function extractCssParts(content) {
  const parts = [];
  const partRegex = /@part\s+(\w+)(?:\s+-\s+(.+))?/g;
  let match;
  while ((match = partRegex.exec(content)) !== null) {
    parts.push({
      name: match[1],
      description: match[2] || ''
    });
  }
  return parts;
}

function extractCssProperties(content) {
  const properties = [];
  const seen = new Set();
  const propRegex = /style\.setProperty\s*\(\s*["'](--[^"']+)["']\s*,\s*["']([^"']*)["']/g;
  let match;
  while ((match = propRegex.exec(content)) !== null) {
    const name = match[1];
    const defaultValue = match[2];
    if (!seen.has(name)) {
      seen.add(name);
      properties.push({
        name: name.replace(/^--/, ''),
        cssVar: name,
        default: defaultValue,
        description: ''
      });
    }
  }
  return properties;
}

function parseUsageMdx(content) {
  let result = content
    .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/<Meta\s+[^>]*\/>/g, '')
    .replace(/<img\s+[^>]*\/>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/;\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  result = result.replace(/^#\s+.*?\n+/, '');

  return result;
}
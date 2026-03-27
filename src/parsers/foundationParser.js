import fs from 'fs-extra';
import path from 'path';

export async function parseFoundations(foundationsPath) {
  const foundations = [];

  const entries = await fs.readdir(foundationsPath, { withFileTypes: true });
  const mdxFiles = entries.filter(e => e.isFile() && e.name.endsWith('.mdx'));

  for (const file of mdxFiles) {
    const filePath = path.join(foundationsPath, file.name);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = parseMdxContent(content);

    const baseName = file.name.replace('.mdx', '');
    const { name, title } = parseFileName(baseName);

    foundations.push({
      name,
      title,
      content: parsed.content,
      tokens: parsed.tokens
    });
  }

  return foundations.sort((a, b) => a.name.localeCompare(b.name));
}

function parseFileName(baseName) {
  const name = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  const title = baseName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return { name, title };
}

function parseMdxContent(content) {
  let parsedContent = content
    .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/<Meta\s+title=.*?\/>/g, '')
    .replace(/<img[^>]*(?:\/>|>[\s\S]*?<\/img>)/g, '')
    .replace(/<ifx-[\s\S]*?<\/ifx-[^>]*>/g, '')
    .replace(/<ifx-[^>]*\/?>/g, '')
    .replace(/^\s*\|[-:\s|]+\s*$/gm, '')
    .replace(/\|[\s\-:]+\|/g, '|')
    .replace(/\n---+\n/g, '\n')
    .replace(/^\s*\|\s*$/gm, '')
    .replace(/^#\s+.+\n+/, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const tokens = extractTokens(content);

  return {
    content: parsedContent,
    tokens
  };
}

function extractTokens(content) {
  const tokens = [];
  const tableRegex = /\|\s*`?\$([^`\s]+)`?\s*\|\s*([^|\n]+)\s*\|/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const tokenName = match[1].trim();
    const tokenValue = match[2].trim().replace(/<[^>]+>/g, '');
    if (tokenName && tokenValue) {
      tokens.push({ name: tokenName, value: tokenValue });
    }
  }

  return tokens;
}
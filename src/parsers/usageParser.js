import fs from 'fs-extra';

const FRAMEWORK_KEYWORDS = {
  vanilla: ['vanilla', 'html', 'javascript', 'js'],
  react: ['react'],
  angular: ['angular'],
  vue: ['vue']
};

const CODE_BLOCK_TYPES = {
  html: ['html'],
  tsx: ['tsx', 'jsx', 'react'],
  vue: ['vue'],
  typescript: ['typescript', 'ts'],
  bash: ['bash', 'sh', 'shell']
};

export async function parseUsage(usagePath) {
  const content = await fs.readFile(usagePath, 'utf-8');
  const lines = content.split('\n');

  const detectedFrameworks = detectFrameworks(lines);
  const sections = initializeSections(detectedFrameworks);

  let currentFramework = null;
  let codeBlock = null;
  let codeContent = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      currentFramework = matchFramework(h2Match[1], detectedFrameworks);
      continue;
    }

    if (line.includes('```') && !line.startsWith('```')) {
      if (codeBlock) {
        const trimmedContent = codeContent.join('\n').trim();
        if (currentFramework && trimmedContent) {
          categorizeContent(sections[currentFramework], codeBlock, trimmedContent);
        }
        codeBlock = null;
        codeContent = [];
      } else {
        codeBlock = detectCodeBlockType(line);
      }
    } else if (codeBlock) {
      codeContent.push(line);
    }
  }

  return sections;
}

function detectFrameworks(lines) {
  const frameworks = new Set();

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      const title = h2Match[1].toLowerCase();
      for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
        if (keywords.some(kw => title.includes(kw))) {
          frameworks.add(framework);
        }
      }
    }
  }

  if (frameworks.size === 0) {
    frameworks.add('vanilla');
  }

  return Array.from(frameworks);
}

function matchFramework(title, frameworks) {
  const lowerTitle = title.toLowerCase();
  for (const framework of frameworks) {
    const keywords = FRAMEWORK_KEYWORDS[framework];
    if (keywords && keywords.some(kw => lowerTitle.includes(kw))) {
      return framework;
    }
  }
  return null;
}

function initializeSections(frameworks) {
  const sections = {};
  for (const framework of frameworks) {
    sections[framework] = { installation: '', examples: [] };
  }
  return sections;
}

function detectCodeBlockType(line) {
  const lower = line.toLowerCase();
  for (const [type, keywords] of Object.entries(CODE_BLOCK_TYPES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return type;
    }
  }
  return 'text';
}

function categorizeContent(section, codeType, content) {
  if (isInstallCommand(content)) {
    section.installation = content;
  } else if (isCodeExample(codeType)) {
    section.examples.push({
      type: codeType,
      content: content
    });
  }
}

function isInstallCommand(content) {
  return /^(npm|pnpm|yarn|bun)\s+(install|add|i)/.test(content.trim());
}

function isCodeExample(codeType) {
  return ['html', 'tsx', 'vue', 'typescript'].includes(codeType);
}
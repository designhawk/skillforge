import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, validateConfig } from './config.js';
import { generateDesignGuidance } from './generators/designGuidanceGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎨 Starting Design Guidance Skill Generator...\n');

  const config = await loadConfig(path.join(__dirname, '../config-design.json'));
  const { errors, warnings } = await validateConfig(config);

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  const { skill, paths, output } = config;
  const SKILL_OUTPUT_DIR = output.dir;
  const REFERENCES_DIR = path.join(SKILL_OUTPUT_DIR, output.referencesDir);

  console.log('📂 Output directory:', SKILL_OUTPUT_DIR);

  await fs.ensureDir(SKILL_OUTPUT_DIR);
  await fs.ensureDir(REFERENCES_DIR);
  await fs.emptyDir(SKILL_OUTPUT_DIR);
  await fs.emptyDir(REFERENCES_DIR);

  const dsVersion = await getDesignSystemVersion(paths.root, paths.packageJson);

  console.log('\n🎯 Generating design guidance skill...');

  await generateDesignGuidance(REFERENCES_DIR, skill.name);
  console.log('  ✅ Design guidance generated');

  const version = skill.version || dsVersion || new Date().toISOString().split('T')[0];

  const skillContent = `---
name: ${skill.name}
description: '${skill.description}'
metadata:
  version: '${dsVersion || 'unknown'}'
---

# Infineon Design System - UI/UX Design Guidance

This skill provides guidance for creating professional enterprise interfaces using the Infineon Design System.

## Overview

Design guidance beyond components - helping developers and designers create effective enterprise interfaces.

## What This Skill Covers

- **Design Principles** - Core UX principles for enterprise applications
- **Layout Patterns** - When to use which layout structure
- **Component Selection** - Choosing the right component for the job
- **Anti-Patterns** - Common mistakes and how to avoid them
- **Visual Design** - Color, typography, and spacing guidance
- **Responsive Design** - Multi-device support patterns
- **Accessibility** - Creating inclusive interfaces

## How to Use This Skill

Use this skill when:
- Designing a new feature or screen
- Choosing between similar components
- Reviewing interface designs
- Creating layouts for enterprise dashboards
- Ensuring accessibility compliance

## Content

See \`references/\` directory for detailed design guidance.
`;

  await fs.writeFile(path.join(SKILL_OUTPUT_DIR, 'SKILL.md'), skillContent);
  console.log('  ✅ SKILL.md generated');

  if (dsVersion) {
    console.log(`  📦 Detected design system version: ${dsVersion}`);
  }

  console.log('\n✨ Design guidance skill generated successfully!');
  console.log(`📁 Output location: ${SKILL_OUTPUT_DIR}`);
}

async function getDesignSystemVersion(rootDir, packageJsonPath) {
  if (!packageJsonPath) return null;

  const fullPath = path.isAbsolute(packageJsonPath)
    ? packageJsonPath
    : path.join(rootDir, packageJsonPath);

  if (!await fs.pathExists(fullPath)) {
    console.warn(`  ⚠️  package.json not found: ${fullPath}`);
    return null;
  }

  try {
    const pkg = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
    return pkg.version || null;
  } catch (err) {
    console.warn(`  ⚠️  Failed to parse package.json: ${err.message}`);
    return null;
  }
}

main().catch(err => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
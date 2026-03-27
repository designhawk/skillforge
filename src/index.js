import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, validateConfig } from './config.js';
import { parseUsage } from './parsers/usageParser.js';
import { parseComponents } from './parsers/componentParser.js';
import { parseTokens } from './parsers/tokenParser.js';
import { parseIcons } from './parsers/iconParser.js';
import { parseFoundations } from './parsers/foundationParser.js';
import { generateSkill } from './generators/skillGenerator.js';
import { generateComponentDocs } from './generators/componentGenerator.js';
import { generateGuides } from './generators/guideGenerator.js';
import { generateDesignGuidance } from './generators/designGuidanceGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanOutputDir(outputDir) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(outputDir, entry.name);
    if (entry.isDirectory() && entry.name !== 'references') {
      await fs.remove(fullPath);
    }
  }

  const githubDir = path.dirname(path.dirname(outputDir));
  const githubEntries = await fs.readdir(githubDir, { withFileTypes: true });
  const skillDirName = path.basename(outputDir);
  for (const entry of githubEntries) {
    if (entry.isDirectory() && entry.name !== 'skills') {
      await fs.remove(path.join(githubDir, entry.name));
    }
  }
}

async function main() {
  console.log('🚀 Starting Copilot Skill Generator...\n');

  const config = await loadConfig();
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

  const { skill, paths, limits, output } = config;
  const SKILL_OUTPUT_DIR = output.dir;
  const REFERENCES_DIR = path.join(SKILL_OUTPUT_DIR, output.referencesDir);

  console.log('📂 Root directory:', paths.root);
  console.log('📂 Output directory:', SKILL_OUTPUT_DIR);

  await fs.ensureDir(SKILL_OUTPUT_DIR);
  await fs.ensureDir(REFERENCES_DIR);
  await cleanOutputDir(SKILL_OUTPUT_DIR);

  console.log('\n📖 Parsing sources...');

  const usageData = await parseUsage(paths.usage);
  console.log('  ✅ USAGE.md parsed');

  const components = await parseComponents(paths.packages.components);
  console.log(`  ✅ ${components.length} components parsed`);

  let tokens = { colors: [], typography: [], spacing: [], borders: [], shadows: [], fonts: [], allTokens: [] };
  if (await fs.pathExists(paths.packages.tokens)) {
    tokens = await parseTokens(paths.packages.tokens);
    console.log(`  ✅ Design tokens parsed (${tokens.colors.length} colors, ${tokens.typography.length} typography)`);
  } else {
    console.log('  ⚠️  Design tokens skipped (not found)');
  }

  let icons = { all: [], categories: {} };
  if (await fs.pathExists(paths.packages.icons)) {
    icons = await parseIcons(paths.packages.icons);
    console.log(`  ✅ Icons parsed (${icons.all.length} icons)`);
  } else {
    console.log('  ⚠️  Icons skipped (not found)');
  }

  let foundations = [];
  if (paths.foundations && await fs.pathExists(paths.foundations)) {
    foundations = await parseFoundations(paths.foundations);
    console.log(`  ✅ Foundations parsed (${foundations.length} foundation docs)`);
  } else {
    console.log('  ⚠️  Foundations skipped (not found)');
  }

  const version = await getVersion(paths.root, paths.packageJson);

  console.log('\n🎯 Generating skill files...');

  console.log('\n🎯 Generating skill files...');

  await generateSkill(SKILL_OUTPUT_DIR, {
    skillName: skill.name,
    skillDescription: skill.description,
    version,
    usageData,
    components,
    tokens,
    icons,
    foundations,
    limits
  });
  console.log('  ✅ SKILL.md generated');

  await generateGuides(REFERENCES_DIR, { usageData, tokens, icons, foundations });
  console.log('  ✅ Guides generated');

  await generateComponentDocs(REFERENCES_DIR, components);
  console.log('  ✅ Component docs generated');

  if (version) {
    console.log(`  📦 Design system version: ${version}`);
  }

  console.log('\n✨ Skill generated successfully!');
  console.log(`📁 Output location: ${SKILL_OUTPUT_DIR}`);
  console.log('\n📋 Next steps:');
  console.log('  1. Review generated files in output directory');
  console.log('  2. Copy contents to your GitLab repo or NPM package');
  console.log('  3. Commit and publish');
}

main().catch(err => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});

async function getVersion(rootDir, packageJsonPath) {
  if (!packageJsonPath) return null;

  const fullPath = path.isAbsolute(packageJsonPath)
    ? packageJsonPath
    : path.join(rootDir, packageJsonPath);

  if (!await fs.pathExists(fullPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
    return pkg.version || null;
  } catch {
    return null;
  }
}
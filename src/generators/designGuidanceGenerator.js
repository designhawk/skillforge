import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

export async function generateDesignGuidance(outputDir, skillName) {
  const designDir = path.join(outputDir, 'design-guidance');
  await fs.ensureDir(designDir);

  const staticData = await loadDesignData();

  await generatePrinciples(designDir, staticData.principles);
  await generateLayouts(designDir, staticData.layouts);
  await generateAntiPatterns(designDir, staticData.antiPatterns);
  await generateComponentSelection(designDir, staticData.componentSelection);
  await generateColorUsage(designDir, staticData.colorUsage);
  await generateResponsive(designDir, staticData.responsive);
  await generateTypography(designDir, staticData.typography);
  await generateAccessibility(designDir, staticData.accessibility);
  await generateIndex(designDir, staticData);
}

async function loadDesignData() {
  const [principles, layouts, antiPatterns, componentSelection, colorUsage, responsive, typography, accessibility] = await Promise.all([
    fs.readJson(path.join(DATA_DIR, 'design-principles.json')),
    fs.readJson(path.join(DATA_DIR, 'design-layouts.json')),
    fs.readJson(path.join(DATA_DIR, 'design-anti-patterns.json')),
    fs.readJson(path.join(DATA_DIR, 'design-component-selection.json')),
    fs.readJson(path.join(DATA_DIR, 'design-color-usage.json')),
    fs.readJson(path.join(DATA_DIR, 'design-responsive.json')),
    fs.readJson(path.join(DATA_DIR, 'design-typography.json')),
    fs.readJson(path.join(DATA_DIR, 'design-accessibility.json'))
  ]);
  return { principles, layouts, antiPatterns, componentSelection, colorUsage, responsive, typography, accessibility };
}

async function generatePrinciples(dir, data) {
  let content = `# ${data.title}

${data.subtitle}

${data.principles.map(p => `
## ${p.title}

${p.description}

${p.guidance.map(g => `- ${g}`).join('\n')}
`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'principles.md'), content);
}

async function generateLayouts(dir, data) {
  let content = `# ${data.title}

${data.description}

${data.patterns.map(p => `
## ${p.name}

**Use when:** ${p.useWhen}

### Structure
${Object.entries(p.structure).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

### Characteristics
${p.characteristics.map(c => `- ${c}`).join('\n')}

### Infineon Components
${p.infineonComponents.map(c => `- \`${c}\``).join('\n')}
`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'layout-patterns.md'), content);
}

async function generateAntiPatterns(dir, data) {
  let content = `# ${data.title}

${data.description}

${data.antiPatterns.map(ap => `
## ${ap.title}

**Problem:** ${ap.problem}

**Impact:** ${ap.impact}

### Solutions
${ap.solutions.map(s => `- ${s}`).join('\n')}
`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'anti-patterns.md'), content);
}

async function generateComponentSelection(dir, data) {
  let content = `# ${data.title}

${data.description}

${data.guidance.map(g => `
## ${g.category}

${g.components.map(c => `
### ${c.name}

**Use for:** ${c.useFor}

**Avoid for:** ${c.avoidFor}

${c.tips.map(t => `- ${t}`).join('\n')}
`).join('\n')}
`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'component-selection.md'), content);
}

async function generateColorUsage(dir, data) {
  let content = `# ${data.title}

${data.description}

## Principles

${data.principles.map(p => `
### ${p.title}

${p.description}

${p.rules.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Status Colors

| Status | Color Token | Meaning | Usage |
|--------|-------------|---------|-------|
${Object.entries(data.statusColors).map(([k, v]) => `| ${k} | \`${v.color}\` | ${v.meaning} | ${v.usage} |`).join('\n')}

## Guidance

### Backgrounds
${Object.entries(data.guidance.backgrounds).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

### Text
${Object.entries(data.guidance.text).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

### Data Visualization Colors
${data.guidance.dataVisualization.map(c => `- \`${c}\``).join('\n')}

### Avoid
${data.guidance.avoid.map(a => `- ${a}`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'color-usage.md'), content);
}

async function generateResponsive(dir, data) {
  let content = `# ${data.title}

${data.description}

## Breakpoints

| Breakpoint | Size | Description |
|------------|------|-------------|
${Object.entries(data.breakpoints).map(([k, v]) => `| ${k} | ${v.size} | ${v.description} |`).join('\n')}

## Principles

${data.principles.map(p => `
### ${p.title}

${p.description}

${p.approach ? Array.isArray(p.approach) ? p.approach.map(a => `- ${a}`).join('\n') : p.approach : ''}
`).join('\n')}

## Patterns

${data.patterns.map(p => `
### ${p.name}

${p.description}

${p.approaches.map(a => `
#### ${a.name}

${a.description}

${a.implementation ? `Implementation: ${a.implementation}` : ''}
${a.breakpoint ? `Breakpoint: ${a.breakpoint}` : ''}
${a.useFor ? `Use for: ${a.useFor}` : ''}
`).join('\n')}
`).join('\n')}

## Testing

${data.testing.map(t => `- ${t}`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'responsive-design.md'), content);
}

async function generateTypography(dir, data) {
  let content = `# ${data.title}

${data.description}

## Font Family

- **Primary:** ${data.fontFamily.primary}
- **Monospace:** ${data.fontFamily.monospace}
- **Usage:** ${data.fontFamily.usage}

## Principles

${data.principles.map(p => `
### ${p.title}

${p.description}

${p.rules.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Type Scale

| Style | Size | Weight | Use For | Line Height |
|-------|------|--------|---------|-------------|
${data.scale.map(s => `| ${s.style} | ${s.size} | ${s.weight} | ${s.useFor} | ${s.lineHeight} |`).join('\n')}

## Common Mistakes

${data.commonMistakes.map(m => `
### ${m.mistake}

**Problem:** ${m.problem}

**Solution:** ${m.solution}
`).join('\n')}

## Best Practices

${data.bestPractices.map(b => `- ${b}`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'typography.md'), content);
}

async function generateAccessibility(dir, data) {
  let content = `# ${data.title}

${data.description}

## Standards

- **WCAG:** ${data.standards.wcag}
- **ARIA:** ${data.standards.aria}

## Key Principles

${data.keyPrinciples.map(p => `
### ${p.title}

${p.description}

**Requirements:**
${p.requirements.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Common Issues

${data.commonIssues.map(i => `
### ${i.issue}

**Problem:** ${i.problem}

**Fix:** ${i.fix}
`).join('\n')}

## Checklist

${Object.entries(data.checklist).map(([category, items]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}
${items.map(item => `- ${item}`).join('\n')}
`).join('\n')}

## Testing

${data.testing.map(t => `- ${t}`).join('\n')}

## Resources

${data.resources.map(r => `- ${r}`).join('\n')}
`;

  await fs.writeFile(path.join(dir, 'accessibility.md'), content);
}

async function generateIndex(dir, data) {
  const content = `# Design Guidance Index

Enterprise UI/UX design guidance for building professional applications with the Infineon Design System.

## Getting Started

- [Design Principles](./principles.md) - Core principles for enterprise UX
- [Layout Patterns](./layout-patterns.md) - Common layouts and when to use them
- [Component Selection](./component-selection.md) - Choosing the right component

## Visual Design

- [Color Usage](./color-usage.md) - Professional color application
- [Typography](./typography.md) - Text hierarchy and readability

## Technical Considerations

- [Responsive Design](./responsive-design.md) - Supporting multiple devices
- [Accessibility](./accessibility.md) - Creating inclusive applications

## Anti-Patterns

- [UI Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid

---

These guides complement the component documentation. Use both together for best results.
`;

  await fs.writeFile(path.join(dir, 'INDEX.md'), content);
}
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { registerTemplates } from '../templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

export async function generateGuides(referencesDir, { usageData, tokens, icons, foundations }) {
  const guidesDir = path.join(referencesDir, 'guides');
  await fs.ensureDir(guidesDir);

  const foundationsDir = path.join(referencesDir, 'foundations');
  await fs.ensureDir(foundationsDir);

  registerTemplates(Handlebars);

  const staticData = await loadStaticData();
  const context = {
    usageData,
    tokens,
    icons,
    foundations,
    staticData,
    frameworks: Object.keys(usageData).filter(f => usageData[f].installation || usageData[f].examples.length > 0)
  };

  await generateGettingStarted(guidesDir, context);
  await generateTheming(guidesDir, tokens);
  await generateIcons(guidesDir, icons);
  await generateAdvanced(guidesDir, staticData);
  await generateTroubleshooting(guidesDir, staticData);
  await generateFoundations(foundationsDir, foundations);

  await generateIndex(referencesDir, foundations);
}

async function loadStaticData() {
  const gettingStarted = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'getting-started.json'), 'utf-8'));
  const advanced = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'advanced.json'), 'utf-8'));
  const troubleshooting = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'troubleshooting.json'), 'utf-8'));
  return { gettingStarted, advanced, troubleshooting };
}

async function generateGettingStarted(guidesDir, context) {
  const gettingStartedDir = path.join(guidesDir, 'getting-started');
  await fs.ensureDir(gettingStartedDir);

  const { staticData, usageData, frameworks } = context;

  const overviewContent = `# ${staticData.gettingStarted.title}

The Infineon Design System is a comprehensive collection of **47+ production-ready web components** built with [Stencil](https://stenciljs.com/), providing a unified UI library across all major JavaScript frameworks.

## What are Web Components?

Web Components are native browser standards that enable creation of reusable, encapsulated UI elements:

| Technology | Description |
|------------|-------------|
{{#each staticData.gettingStarted.technologies}}
| **{{name}}** | {{description}} |
{{/each}}

## Why Web Components?

### Key Benefits

{{#each staticData.gettingStarted.benefits}}
1. **{{title}}** - {{description}}
{{/each}}

### Browser Support

All modern browsers support Web Components:
{{#each staticData.gettingStarted.browserSupport}}
- {{this}}
{{/each}}

## Packages Overview

| Package | Purpose | Framework |
|---------|---------|-----------|
{{#each staticData.gettingStarted.packages}}
| \`{{name}}\` | {{purpose}} | {{framework}} |
{{/each}}

## Quick Start

Choose your framework below:

{{#each frameworks}}
- [{{capitalize this}}](./installation-{{this}}.md) - {{#with (lookup ../usageData this)}}{{#if installation}}Installation and setup{{else}}Usage examples{{/if}}{{/with}}
{{/each}}

## Key Concepts

### Event Naming Convention

All component events use the \`ifx\` prefix:

| Event | When Fired |
|-------|------------|
{{#each staticData.gettingStarted.eventNaming}}
| \`{{event}}\` | {{when}} |
{{/each}}

### Component Naming

| Type | Tag Example | React Component | Import |
|------|------------|-----------------|--------|
{{#each staticData.gettingStarted.componentNaming}}
| {{type}} | \`{{tag}}\` | \`{{react}}\` | {{import}} |
{{/each}}

## Resources

- [Storybook](https://infineon.github.io/infineon-design-system-stencil/) - Interactive documentation
- [GitHub Repository](https://github.com/Infineon/infineon-design-system-stencil) - Source code
- [npm Registry](https://www.npmjs.com/package/@infineon/infineon-design-system-stencil) - Package info
`;

  await fs.writeFile(path.join(gettingStartedDir, 'overview.md'), overviewContent);

  for (const framework of frameworks) {
    const content = await generateFrameworkGuide(framework, usageData[framework]);
    await fs.writeFile(path.join(gettingStartedDir, `installation-${framework}.md`), content);
  }
}

async function generateFrameworkGuide(framework, data) {
  const frameworkName = framework.charAt(0).toUpperCase() + framework.slice(1);
  const title = `${frameworkName} Installation`;

  let installationSection = '';
  if (data.installation) {
    installationSection = `## Installation

\`\`\`bash
${data.installation}
\`\`\`
`;
  }

  let examplesSection = '';
  if (data.examples && data.examples.length > 0) {
    examplesSection = `## Usage

${data.examples.map(ex => `\`\`\`${ex.type}
${ex.content}
\`\`\``).join('\n\n')}
`;
  }

  return `# ${title}

Use the Infineon Design System in your ${frameworkName} application.

${installationSection}
${examplesSection}

For more examples, see the [Storybook](https://infineon.github.io/infineon-design-system-stencil/).
`;
}

async function generateTheming(guidesDir, tokens) {
  const themingDir = path.join(guidesDir, 'theming');
  await fs.ensureDir(themingDir);

  const colorTokenList = tokens.colors.length > 0
    ? tokens.colors.map(t => `| \`${t.scssVar}\` | \`${t.cssVar}\` | \`${t.value}\` |`).join('\n')
    : 'See @infineon/design-system-tokens for full color palette';

  const typographyTokenList = tokens.typography.length > 0
    ? tokens.typography.map(t => `| \`${t.scssVar}\` | \`${t.cssVar}\` | \`${t.value}\` |`).join('\n')
    : 'See @infineon/design-system-tokens for full typography tokens';

  const content = `# Theming Guide

Customize the appearance of Infineon Design System components using CSS custom properties and design tokens.

## CSS Custom Properties

All components support theming via CSS custom properties (CSS variables). These pierce the Shadow DOM boundary.

### How CSS Variables Work

\`\`\`css
/* Define on :root to apply globally */
:root {
  --button-bg: #000000;
  --button-color: #ffffff;
}

/* Or scope to specific element */
.my-section {
  --button-bg: #ff0000;
}

/* Override specific component instance */
ifx-button.special {
  --button-bg: #00ff00;
}
\`\`\`

### Component Variables

Each component exposes CSS variables for customization:

\`\`\`css
/* Button component */
ifx-button {
  --button-bg: var(--color-primary-500);
  --button-color: var(--color-white);
  --button-border-radius: 4px;
  --button-padding-x: 16px;
  --button-padding-y: 8px;
  --button-font-weight: 600;
  --button-font-size: 14px;
  --button-transition: all 0.2s ease;
}

/* Input component */
ifx-input {
  --input-bg: var(--color-white);
  --input-border: 1px solid var(--color-neutral-300);
  --input-border-radius: 4px;
  --input-padding: 8px 12px;
  --input-focus-border: var(--color-primary-500);
}

/* Card component */
ifx-card {
  --card-bg: var(--color-white);
  --card-border-radius: 8px;
  --card-padding: 24px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
\`\`\`

## Design Tokens

Design tokens are the visual design atoms of the design system - the underlying values that make up our visual language. This design system includes **${tokens.colors.length} color tokens** and **${tokens.typography.length} typography tokens**.

### Package

\`\`\`bash
npm install @infineon/design-system-tokens
\`\`\`

### Usage

#### SCSS Import

\`\`\`scss
// In your main SCSS file
@import '@infineon/design-system-tokens/dist/tokens.scss';

// Use tokens in SCSS
.my-component {
  color: $ifxColorPrimary500;
  background: $ifxColorNeutral100;
  font-family: $ifxFontFamilySans;
  border-radius: $ifxBorderRadius100;
  padding: $ifxSpace400 $ifxSpace600;
}
\`\`\`

#### CSS Variables (Generated)

\`\`\`css
/* Import generated CSS variables */
@import '@infineon/design-system-tokens/dist/tokens.css';

.my-component {
  color: var(--ifx-color-primary-500);
  background: var(--ifx-color-neutral-100);
  font-family: var(--ifx-font-family-body);
  border-radius: var(--ifx-border-radius-100);
  padding: var(--ifx-space-400) var(--ifx-space-600);
}
\`\`\`

### Color Tokens

| SCSS Variable | CSS Variable | Value |
|---------------|--------------|-------|
${colorTokenList}

### Typography Tokens

| SCSS Variable | CSS Variable | Value |
|---------------|--------------|-------|
${typographyTokenList}

### Tailwind CSS Integration

\`\`\`bash
npm install @infineon/infineon-design-system-tailwind-config
\`\`\`

\`\`\`javascript
// tailwind.config.js
module.exports = {
  // ...
  presets: [require('@infineon/infineon-design-system-tailwind-config')],
  // ...
}
\`\`\`
`;

  await fs.writeFile(path.join(themingDir, 'theming.md'), content);
}

async function generateIcons(guidesDir, icons) {
  const iconsDir = path.join(guidesDir, 'icons');
  await fs.ensureDir(iconsDir);

  const iconList = icons.all.length > 0
    ? icons.all.map(i => `- \`${i}\``).join('\n')
    : 'No icons found';

  const content = `# Icons Guide

The Infineon icon library provides **${icons.all.length} SVG icons** optimized for clarity and consistency.

## Installation

\`\`\`bash
npm install @infineon/infineon-icons
\`\`\`

## Usage

### JavaScript/TypeScript

\`\`\`typescript
import library from '@infineon/infineon-icons/library';
import { cCheck16, cArrowRight24 } from '@infineon/infineon-icons';

// Add icons to the library
library.add(cCheck16, cArrowRight24);

// Or add all icons at once
import * as allIcons from '@infineon/infineon-icons';
library.add(...Object.values(allIcons));
\`\`\`

### HTML

\`\`\`html
<!-- Using the icon web component -->
<ifx-icon name="check-16"></ifx-icon>
<ifx-icon name="arrow-right-24"></ifx-icon>
\`\`\`

### React

\`\`\`tsx
import { IfxIcon } from '@infineon/infineon-design-system-react';
import { cCheck16, cArrowRight24 } from '@infineon/infineon-icons';

function MyComponent() {
  return (
    <div>
      <IfxIcon icon={cCheck16} size="16" />
      <IfxIcon icon={cArrowRight24} size="24" />
    </div>
  );
}
\`\`\`

## Icon Naming Convention

Icons follow a naming pattern: \`{name}-{size}\`

| Size | Example |
|------|---------|
| 16px | \`check-16\`, \`arrow-left-16\` |
| 24px | \`arrow-right-24\`, \`settings-24\` |

## Available Icons

${iconList}

## Accessibility

- Always provide \`aria-label\` for decorative icons
- Use appropriate \`role\` attributes when needed
- Test with screen readers to ensure proper announcement
`;

  await fs.writeFile(path.join(iconsDir, 'icons.md'), content);
}

async function generateAdvanced(guidesDir, staticData) {
  const advancedDir = path.join(guidesDir, 'advanced');
  await fs.ensureDir(advancedDir);

  const { shadowDom, ssr, forms, accessibility } = staticData.advanced;

  const shadowDomContent = `# ${shadowDom.title}

${shadowDom.description}

## Overview

${shadowDom.overview}

## Key Implications

{{#each shadowDom.implications}}
- {{this}}
{{/each}}

## Theming Approach

${shadowDom.themingApproach}

### Example CSS Variables

\`\`\`css
/* Button component */
ifx-button {
  --button-bg: var(--color-primary-500);
  --button-color: var(--color-white);
}
\`\`\`

## Resources

- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [WebComponents.org](https://www.webcomponents.org/)
`;

  await fs.writeFile(path.join(advancedDir, 'shadow-dom.md'), shadowDomContent);

  const ssrContent = `# ${ssr.title}

${ssr.description}

## Overview

${ssr.overview}

## Framework-Specific Approaches

### Next.js

\`\`\`typescript
// Use dynamic import with ssr: false
const MyComponent = dynamic(() => import('./MyComponent'), { ssr: false });
\`\`\`

### Nuxt.js

\`\`\`vue
<template>
  <ClientOnly>
    <ifx-button>Click me</ifx-button>
  </ClientOnly>
</template>
\`\`\`

### Angular Universal

Use @angular/ssr with TransferState for hydration.

## Common Pattern

${ssr.commonPattern}

## Resources

- [Stencil SSR Guide](https://stenciljs.com/docs/ssr)
`;

  await fs.writeFile(path.join(advancedDir, 'ssr.md'), ssrContent);

  const formsContent = `# ${forms.title}

${forms.description}

## Integration Approaches

{{#each forms.approaches}}
### {{name}}

{{description}}
{{/each}}

## Validation

{{#each forms.validation}}
- {{this}}
{{/each}}

## Resources

- [HTML Form Guide](https://developer.mozilla.org/en-US/docs/Learn/Forms)
`;

  await fs.writeFile(path.join(advancedDir, 'forms.md'), formsContent);

  const a11yContent = `# ${accessibility.title}

${accessibility.description}

## Core Principles

{{#each accessibility.principles}}
### {{name}}

{{description}}
{{/each}}

## Testing

{{#each accessibility.testing}}
- {{this}}
{{/each}}

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
`;

  await fs.writeFile(path.join(advancedDir, 'accessibility.md'), a11yContent);
}

async function generateTroubleshooting(guidesDir, staticData) {
  const { troubleshooting } = staticData;

  let sectionsContent = '';
  for (const section of troubleshooting.sections) {
    sectionsContent += `## ${section.title}\n\n`;
    for (const item of section.items) {
      sectionsContent += `### ${item.problem}\n\n`;
      sectionsContent += item.solutions.map(s => `- ${s}`).join('\n') + '\n\n';
    }
  }

  const content = `# ${troubleshooting.title}

${troubleshooting.description}

${sectionsContent}

## Getting Help

### Before Asking

{{#each troubleshooting.gettingHelp.beforeAsking}}
- {{this}}
{{/each}}

### Opening an Issue

Include:
- Component and version
- Framework and version
- Minimal reproduction
- Expected vs actual behavior
- Browser and OS
`;

  await fs.writeFile(path.join(guidesDir, 'troubleshooting.md'), content);
}

async function generateFoundations(foundationsDir, foundations) {
  await fs.ensureDir(foundationsDir);

  for (const foundation of foundations) {
    let tokenSection = '';
    if (foundation.tokens && foundation.tokens.length > 0 && foundation.name !== 'tokens') {
      tokenSection = `## Tokens

| Token | Value |
|-------|-------|
${foundation.tokens.map(t => `| \`${t.name}\` | ${t.value} |`).join('\n')}
`;
    }

    const content = `# ${foundation.title}

This guide covers the ${foundation.title.toLowerCase()} foundation for the Infineon Design System.

${tokenSection}
`;
    await fs.writeFile(path.join(foundationsDir, `${foundation.name}.md`), content);
  }
}

async function generateIndex(referencesDir, foundations) {
  const foundationLinks = foundations
    .map(f => `- [${f.title}](./foundations/${f.name}.md) - ${f.tokens.length} tokens`)
    .join('\n');

  const lines = [
    '# Infineon Design System References',
    '',
    `This references directory contains ${foundations.length} design foundations and component documentation.`,
    '',
    '## Design Foundations',
    foundationLinks,
    '',
    '## Getting Started',
    '- [Overview](./guides/getting-started/overview.md)',
    '- [Vanilla HTML](./guides/getting-started/installation-vanilla.md)',
    '- [React](./guides/getting-started/installation-react.md)',
    '- [Angular](./guides/getting-started/installation-angular.md)',
    '- [Vue](./guides/getting-started/installation-vue.md)',
    '',
    '## Theming',
    '- [Theming Guide](./guides/theming/theming.md) - CSS variables, design tokens, Tailwind',
    '',
    '## Icons',
    '- [Icons Guide](./guides/icons/icons.md) - SVG icons, icon font, accessibility',
    '',
    '## Advanced',
    '- [Shadow DOM](./guides/advanced/shadow-dom.md) - Styling encapsulated components',
    '- [SSR](./guides/advanced/ssr.md) - Server-side rendering with Next.js, Nuxt, Angular Universal',
    '- [Forms](./guides/advanced/forms.md) - Form integration patterns',
    '- [Accessibility](./guides/advanced/accessibility.md) - a11y best practices',
    '',
    '## Troubleshooting',
    '- [Troubleshooting](./guides/troubleshooting.md) - Common issues and solutions',
    '',
    '## UI/UX Design Guidance',
    '- [Design Principles](./design-guidance/principles.md) - Core principles for enterprise UX',
    '- [Layout Patterns](./design-guidance/layout-patterns.md) - Common layouts and when to use them',
    '- [Component Selection](./design-guidance/component-selection.md) - Choosing the right component',
    '- [Anti-Patterns](./design-guidance/anti-patterns.md) - Common mistakes to avoid',
    '- [Color Usage](./design-guidance/color-usage.md) - Professional color application',
    '- [Typography](./design-guidance/typography.md) - Text hierarchy and readability',
    '- [Responsive Design](./design-guidance/responsive-design.md) - Supporting multiple devices',
    '- [Accessibility](./design-guidance/accessibility.md) - Creating inclusive applications',
    '',
    '## Components',
    'See [./components/](./components/) directory for all component documentation.'
  ];

  await fs.writeFile(path.join(referencesDir, 'index.md'), lines.join('\n'));
}

Handlebars.registerHelper('capitalize', function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
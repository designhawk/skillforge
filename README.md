# SkillForge

> A powerful CLI tool that auto-generates GitHub Copilot skills for design systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## Overview

SkillForge transforms design system documentation into intelligent GitHub Copilot skills. It parses component documentation, design tokens, and UI/UX guidelines to generate comprehensive skill files that help Copilot provide accurate, context-aware assistance.

Currently supporting the **Infineon Design System** with:

- **47+ component documentations** (props, events, CSS properties, usage guidance)
- **9 design foundation docs** (tokens for colors, typography, spacing, etc.)
- **9 UI/UX guidance documents** (accessibility, layouts, anti-patterns, etc.)

---

## Generated Output Structure

```
.github/skills/
├── infineon-design-system/
│   ├── SKILL.md                    # Main skill file
│   └── references/
│       ├── components/             # 47 component docs
│       ├── foundations/            # 9 design foundation docs
│       └── guides/                 # Getting started, theming, icons, etc.
│
└── infineon-design-uiux/
    ├── SKILL.md                    # Main skill file
    └── references/
        └── design-guidance/        # 9 UI/UX guidance docs
```

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
git clone https://github.com/designhawk/skillforge.git
cd skillforge
npm install
```

### Generate Skills

```bash
# Generate component & foundation skill (infineon-design-system)
npm run generate

# Generate UI/UX design skill (infineon-design-uiux)
npm run generate:design
```

---

## Configuration

### Main Skill (`config.json`)

Controls what gets included in `infineon-design-system`:

```json
{
  "skill": {
    "name": "infineon-design-system",
    "description": "Infineon Design System for building UIs..."
  },
  "paths": {
    "root": null,
    "usage": "USAGE.md",
    "packageJson": "packages/components/package.json"
  },
  "output": {
    "dir": ".github/skills/infineon-design-system"
  }
}
```

### Design Skill (`config-design.json`)

Controls what gets included in `infineon-design-uiux`:

```json
{
  "design": {
    "outputDir": ".github/skills/infineon-design-uiux/references/design-guidance"
  }
}
```

---

## Architecture

### Parser Modules

| Module | Purpose |
|--------|---------|
| `componentParser.js` | Parses component readme.md and Usage.mdx files |
| `foundationParser.js` | Parses design foundation MDX files, extracts tokens |
| `tokenParser.js` | Extracts design tokens from `@infineon/design-system-tokens` |
| `iconParser.js` | Extracts icon list from `@infineon/infineon-icons` |
| `usageParser.js` | Parses framework installation commands |

### Generator Modules

| Module | Purpose |
|--------|---------|
| `skillGenerator.js` | Creates SKILL.md with version tracking |
| `componentGenerator.js` | Generates component documentation |
| `guideGenerator.js` | Generates guides (theming, icons, troubleshooting) |
| `designGuidanceGenerator.js` | Generates UI/UX design guidance |

### Template System

Uses Handlebars templates:
- `component.hbs` - Component documentation template
- `SKILL.md.hbs` - Main skill file template

---

## Extending

### Adding a New Parser

1. Create parser in `src/parsers/`
2. Export an async function that returns structured data
3. Import and call in `src/index.js`

### Modifying Component Template

Edit `src/templates/component.hbs`. Available data:

```handlebars
{{name}}           # Component name (e.g., "button")
{{displayName}}    # Display name (e.g., "Button")
{{description}}    # From readme.md
{{usageContent}}   # Parsed from Usage.mdx
{{props}}          # Array of {name, type, default, description}
{{events}}         # Array of {name, detail, description}
{{cssProperties}}  # Array of {name, cssVar, default}
{{cssParts}}       # Array of {name, description}
```

---

## Troubleshooting

### Empty props/events for a component

Check if:
1. The component has a `readme.md` file
2. The readme.md has properly formatted tables
3. The component isn't a container directory with subcomponents

### HTML entities showing (e.g., `&quot;` instead of `"`)

Handled automatically. The template uses triple braces `{{{variable}}}` to prevent Handlebars HTML-escaping.

---

## License

MIT - Infineon Technologies AG

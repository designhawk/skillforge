import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { registerTemplates } from '../templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSkill(outputDir, {
  skillName,
  skillDescription,
  version,
  usageData,
  components,
  tokens,
  icons,
  foundations,
  limits
}) {
  registerTemplates(Handlebars);

  const templatePath = path.join(__dirname, '../templates/SKILL.md.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  const frameworks = Object.keys(usageData).filter(
    f => usageData[f].installation || usageData[f].examples.length > 0
  );

  const colorTokens = limits?.colorTokens ? tokens.colors.slice(0, limits.colorTokens) : tokens.colors;
  const typographyTokens = limits?.typographyTokens ? tokens.typography.slice(0, limits.typographyTokens) : tokens.typography;
  const iconNames = limits?.icons ? icons.all.slice(0, limits.icons) : icons.all;

  const skillContent = template({
    skillName,
    skillDescription,
    version,
    totalComponents: components.length,
    componentNames: components.map(c => c.name),
    frameworks,
    packages: [
      '@infineon/infineon-design-system-stencil',
      '@infineon/infineon-design-system-react',
      '@infineon/infineon-design-system-angular',
      '@infineon/infineon-design-system-vue',
      '@infineon/design-system-tokens',
      '@infineon/infineon-icons'
    ],
    totalColorTokens: tokens.colors.length,
    totalTypographyTokens: tokens.typography.length,
    colorTokens,
    typographyTokens,
    totalIcons: icons.all.length,
    iconNames,
    foundations,
    totalFoundations: foundations.length
  });

  await fs.writeFile(path.join(outputDir, 'SKILL.md'), skillContent);
}
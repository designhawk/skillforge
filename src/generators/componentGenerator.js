import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { registerTemplates } from '../templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateComponentDocs(referencesDir, components) {
  const componentsDir = path.join(referencesDir, 'components');
  await fs.ensureDir(componentsDir);

  registerTemplates(Handlebars);

  const templatePath = path.join(__dirname, '../templates/component.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  for (const component of components) {
    const content = template(component);
    await fs.writeFile(
      path.join(componentsDir, `${component.name}.md`),
      content
    );
  }
}

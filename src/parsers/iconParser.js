import fs from 'fs-extra';
import path from 'path';

export async function parseIcons(iconsPath) {
  const icons = {
    all: [],
    categories: {}
  };

  const distPath = path.join(iconsPath, 'dist');

  const iconsJsPath = path.join(distPath, 'icons.js');
  if (await fs.pathExists(iconsJsPath)) {
    const content = await fs.readFile(iconsJsPath, 'utf-8');
    icons.all = parseIconsJs(content);
  }

  const svgDir = path.join(iconsPath, 'svg');
  if (await fs.pathExists(svgDir)) {
    const svgFiles = await fs.readdir(svgDir);
    const svgIcons = svgFiles
      .filter(f => f.endsWith('.svg'))
      .map(f => f.replace('.svg', ''));
    if (svgIcons.length > icons.all.length) {
      icons.all = svgIcons;
    }
  }

  icons.all = [...new Set(icons.all)].sort();
  return icons;
}

function parseIconsJs(content) {
  const icons = [];

  const varMatches = content.matchAll(/var\s+(\w+)\s*=\s*"/g);
  for (const match of varMatches) {
    const varName = match[1];
    if (varName.endsWith('Icon') || varName.match(/[A-Z]/)) {
      const cleanName = varName
        .replace(/Icon$/, '')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/^(\d)/, 'n$1')
        .toLowerCase();
      icons.push(cleanName);
    }
  }

  return icons;
}

import fs from 'fs-extra';
import path from 'path';

const TOKEN_PREFIX_CONFIG = {
  colors: ['ifxColor', 'ifxColour'],
  typography: ['ifxTypography', 'ifxFont', 'ifxHeading', 'ifxEyebrow', 'ifxBody', 'ifxLineHeight', 'ifxLetterSpacing', 'ifxParagraphSpacing', 'ifxTextCase', 'ifxTextDecoration'],
  spacing: ['ifxSpace'],
  borders: ['ifxBorderRadius', 'ifxBorderWidth'],
  shadows: ['ifxShadow'],
  fonts: ['ifxFontFamily', 'ifxFontSize', 'ifxFontWeight'],
  breakpoints: ['ifxBreakpoint'],
  sizes: ['ifxSize'],
  opacity: ['ifxOpacity']
};

export async function parseTokens(tokensPath) {
  let tokens = {
    colors: [],
    typography: [],
    spacing: [],
    borders: [],
    shadows: [],
    fonts: [],
    breakpoints: [],
    sizes: [],
    opacity: [],
    allTokens: []
  };

  const distPath = path.join(tokensPath, 'dist');

  const scssPath = path.join(distPath, '_tokens.scss');
  if (await fs.pathExists(scssPath)) {
    const scssContent = await fs.readFile(scssPath, 'utf-8');
    tokens = parseScssTokens(scssContent);
  }

  tokens.allTokens = [
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.borders,
    ...tokens.shadows,
    ...tokens.fonts,
    ...tokens.breakpoints,
    ...tokens.sizes,
    ...tokens.opacity
  ];

  return tokens;
}

function parseScssTokens(scssContent) {
  const tokens = {
    colors: [],
    typography: [],
    spacing: [],
    borders: [],
    shadows: [],
    fonts: [],
    breakpoints: [],
    sizes: [],
    opacity: []
  };

  const lines = scssContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('$') === false) {
      continue;
    }

    const varMatch = trimmed.match(/^\$([^:]+):\s*(.+);/);
    if (varMatch) {
      const tokenName = varMatch[1].trim();
      const tokenValue = varMatch[2].trim();

      const token = {
        name: tokenName,
        value: tokenValue,
        scssVar: `$${tokenName}`,
        cssVar: `--${tokenName.replace(/-/g, '-')}`
      };

      const categorized = categorizeToken(tokenName, tokens);
      if (categorized) {
        tokens[categorized].push(token);
      }
    }
  }

  return tokens;
}

function categorizeToken(tokenName, tokens) {
  for (const [category, prefixes] of Object.entries(TOKEN_PREFIX_CONFIG)) {
    if (prefixes.some(prefix => tokenName.startsWith(prefix))) {
      return category;
    }
  }
  return null;
}

export function getTokenCategories() {
  return Object.keys(TOKEN_PREFIX_CONFIG);
}

export function getTokenPrefixes() {
  return TOKEN_PREFIX_CONFIG;
}
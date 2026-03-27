import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config = null;

export async function loadConfig(configPath = null) {
  if (config) return config;

  const defaultPath = path.join(__dirname, '../config.json');
  const resolvedPath = configPath || defaultPath;

  if (!await fs.pathExists(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const rawConfig = JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));
  config = resolveConfig(rawConfig, path.dirname(resolvedPath));

  const isLocal = process.env.LOCAL_DEV === 'true';
  if (isLocal && config.output.localDir) {
    config.output.dir = path.join(config.paths.root, config.output.localDir);
  }

  return config;
}

function resolveConfig(cfg, configDir) {
  const resolved = JSON.parse(JSON.stringify(cfg));

  if (resolved.paths.root === null) {
    resolved.paths.root = path.resolve(configDir, '../..');
  } else {
    resolved.paths.root = path.resolve(resolved.paths.root);
  }

  const root = resolved.paths.root;

  if (resolved.paths.usage && !path.isAbsolute(resolved.paths.usage)) {
    resolved.paths.usage = path.join(root, resolved.paths.usage);
  }

  if (resolved.paths.packages) {
    for (const [key, pkgPath] of Object.entries(resolved.paths.packages)) {
      if (!path.isAbsolute(pkgPath)) {
        resolved.paths.packages[key] = path.join(root, pkgPath);
      }
    }
  }

  if (resolved.paths.foundations && !path.isAbsolute(resolved.paths.foundations)) {
    resolved.paths.foundations = path.join(root, resolved.paths.foundations);
  }

  if (resolved.output && resolved.output.dir && !path.isAbsolute(resolved.output.dir)) {
    resolved.output.dir = path.join(root, resolved.output.dir);
  }

  return resolved;
}

export async function validateConfig(cfg) {
  const errors = [];
  const warnings = [];

  if (!cfg.skill?.name) {
    errors.push('skill.name is required');
  } else if (!/^[a-z0-9-]+$/.test(cfg.skill.name)) {
    errors.push('skill.name must be lowercase with hyphens only');
  }

  if (cfg.paths) {
    if (!cfg.paths.root) {
      errors.push('paths.root is required');
    } else if (!await fs.pathExists(cfg.paths.root)) {
      errors.push(`paths.root does not exist: ${cfg.paths.root}`);
    }
  }

  if (cfg.paths?.usage && !await fs.pathExists(cfg.paths.usage)) {
    warnings.push(`paths.usage not found: ${cfg.paths.usage}`);
  }

  if (cfg.paths?.packages?.components && !await fs.pathExists(cfg.paths.packages.components)) {
    warnings.push(`paths.packages.components not found: ${cfg.paths.packages.components}`);
  }

  if (cfg.paths?.packages?.tokens && !await fs.pathExists(cfg.paths.packages.tokens)) {
    warnings.push(`paths.packages.tokens not found: ${cfg.paths.packages.tokens}`);
  }

  if (cfg.paths?.packages?.icons && !await fs.pathExists(cfg.paths.packages.icons)) {
    warnings.push(`paths.packages.icons not found: ${cfg.paths.packages.icons}`);
  }

  if (cfg.paths?.foundations && !await fs.pathExists(cfg.paths.foundations)) {
    warnings.push(`paths.foundations not found: ${cfg.paths.foundations}`);
  }

  return { errors, warnings };
}

export function getConfig() {
  return config;
}

export function resetConfig() {
  config = null;
}
/**
 * Configuration loader utilities
 * Load i18nexus.config.json from filesystem or bundler
 */

import * as fs from "fs";
import * as path from "path";
import type { I18nexusConfig } from "./config";
import { validateConfig } from "./config";

/**
 * Load configuration from file
 * Works in Node.js environment (server-side)
 */
export async function loadConfigFromFile(
  configPath?: string,
): Promise<I18nexusConfig | null> {
  try {
    const resolvedPath =
      configPath || path.resolve(process.cwd(), "i18nexus.config.json");

    // Try JSON file first
    if (fs.existsSync(resolvedPath)) {
      const raw = await fs.promises.readFile(resolvedPath, "utf8");
      const config = JSON.parse(raw);
      return validateConfig(config);
    }

    // Try JS/TS file
    const jsPath = resolvedPath.replace(".json", ".js");
    if (fs.existsSync(jsPath)) {
      const module = await import(jsPath);
      const config = module.default || module;
      return validateConfig(config);
    }

    return null;
  } catch (error) {
    console.error("[i18nexus] Error loading config:", error);
    return null;
  }
}

/**
 * Load configuration synchronously
 * Useful for setup scripts and build tools
 */
export function loadConfigFromFileSync(
  configPath?: string,
): I18nexusConfig | null {
  try {
    const resolvedPath =
      configPath || path.resolve(process.cwd(), "i18nexus.config.json");

    if (fs.existsSync(resolvedPath)) {
      const raw = fs.readFileSync(resolvedPath, "utf8");
      const config = JSON.parse(raw);
      return validateConfig(config);
    }

    return null;
  } catch (error) {
    console.error("[i18nexus] Error loading config:", error);
    return null;
  }
}

/**
 * Load configuration with fallback
 * Tries multiple locations and methods
 */
export async function loadConfig(
  options?: {
    configPath?: string;
    fallback?: Partial<I18nexusConfig>;
  },
): Promise<I18nexusConfig> {
  const { configPath, fallback } = options || {};

  // Try to load from file
  const fileConfig = await loadConfigFromFile(configPath);
  if (fileConfig) {
    return fileConfig;
  }

  // Try to load from environment
  const envConfig = loadConfigFromEnv();
  if (envConfig) {
    return validateConfig(envConfig);
  }

  // Use fallback or default
  if (fallback) {
    return validateConfig(fallback);
  }

  throw new Error(
    "i18nexus config not found. Please create i18nexus.config.json or provide fallback config.",
  );
}

/**
 * Load configuration from environment variables
 * Useful for deployment environments
 */
export function loadConfigFromEnv(): Partial<I18nexusConfig> | null {
  try {
    const configJson = process.env.I18NEXUS_CONFIG;
    if (!configJson) {
      return null;
    }

    return JSON.parse(configJson);
  } catch (error) {
    console.error("[i18nexus] Error loading config from env:", error);
    return null;
  }
}

/**
 * Save configuration to file
 * Useful for CLI tools and setup scripts
 */
export async function saveConfigToFile(
  config: I18nexusConfig,
  configPath?: string,
): Promise<void> {
  const resolvedPath =
    configPath || path.resolve(process.cwd(), "i18nexus.config.json");

  const validated = validateConfig(config);
  const json = JSON.stringify(validated, null, 2);

  await fs.promises.writeFile(resolvedPath, json, "utf8");
}

/**
 * Check if config file exists
 */
export function hasConfigFile(configPath?: string): boolean {
  const resolvedPath =
    configPath || path.resolve(process.cwd(), "i18nexus.config.json");
  return fs.existsSync(resolvedPath);
}

/**
 * Get config file path
 */
export function getConfigPath(customPath?: string): string {
  if (customPath) {
    return path.resolve(process.cwd(), customPath);
  }

  // Try standard locations
  const locations = [
    "i18nexus.config.json",
    "i18nexus.config.js",
    ".i18nexusrc.json",
    ".i18nexusrc",
  ];

  for (const location of locations) {
    const fullPath = path.resolve(process.cwd(), location);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return path.resolve(process.cwd(), "i18nexus.config.json");
}

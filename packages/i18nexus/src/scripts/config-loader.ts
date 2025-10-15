#!/usr/bin/env node

import * as fs from "fs";
import * as pathLib from "path";
import { pathToFileURL } from "url";

export interface I18nexusConfig<
  TLanguages extends readonly string[] = string[],
> {
  languages: TLanguages;
  defaultLanguage: string;
  localesDir: string;
  sourcePattern: string;
  translationImportSource: string;
  googleSheets?: {
    spreadsheetId: string;
    credentialsPath: string;
    sheetName: string;
  };
}

/**
 * Extract language union type from config
 * @example
 * const config = { languages: ["en", "ko"] as const, ... };
 * type Languages = ExtractLanguages<typeof config>; // "en" | "ko"
 */
export type ExtractLanguages<T extends I18nexusConfig<readonly string[]>> =
  T["languages"][number];

const DEFAULT_CONFIG: I18nexusConfig = {
  languages: ["en", "ko"],
  defaultLanguage: "ko",
  localesDir: "./locales",
  sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
  translationImportSource: "i18nexus",
  googleSheets: {
    spreadsheetId: "",
    credentialsPath: "./credentials.json",
    sheetName: "Translations",
  },
};

/**
 * i18nexus.config 파일을 로드합니다. (.ts, .js, .json 지원)
 * 파일이 없으면 기본 설정을 반환합니다.
 */
export async function loadConfig(
  configPath?: string,
  options?: { silent?: boolean }
): Promise<I18nexusConfig> {
  const cwd = process.cwd();

  // 파일 경로 결정 (우선순위: .ts > .js > .json)
  let absolutePath: string;
  let isTypeScript = false;
  let isModule = false;

  if (configPath) {
    absolutePath = pathLib.resolve(cwd, configPath);
  } else {
    // 자동 탐색
    const tsPath = pathLib.resolve(cwd, "i18nexus.config.ts");
    const jsPath = pathLib.resolve(cwd, "i18nexus.config.js");
    const jsonPath = pathLib.resolve(cwd, "i18nexus.config.json");

    if (fs.existsSync(tsPath)) {
      absolutePath = tsPath;
      isTypeScript = true;
      isModule = true;
    } else if (fs.existsSync(jsPath)) {
      absolutePath = jsPath;
      isModule = true;
    } else if (fs.existsSync(jsonPath)) {
      absolutePath = jsonPath;
    } else {
      if (!options?.silent) {
        console.log(
          "⚠️  i18nexus.config not found, using default configuration"
        );
        console.log("💡 Run 'i18n-sheets init' to create a config file");
      }
      return DEFAULT_CONFIG;
    }
  }

  if (!fs.existsSync(absolutePath)) {
    if (!options?.silent) {
      console.log("⚠️  i18nexus.config not found, using default configuration");
      console.log("💡 Run 'i18n-sheets init' to create a config file");
    }
    return DEFAULT_CONFIG;
  }

  try {
    if (isModule) {
      // TypeScript or JavaScript module
      if (isTypeScript) {
        // TypeScript 파일의 경우, tsx나 ts-node를 사용하거나 컴파일이 필요
        // 개발 환경에서는 tsx/ts-node 사용을 권장
        if (!options?.silent) {
          console.log(
            "⚠️  TypeScript config detected. Make sure to use tsx or ts-node to run your app."
          );
        }
      }

      const fileUrl = pathToFileURL(absolutePath).href;
      const module = await import(fileUrl);
      const config = module.default || module.config;

      if (!config) {
        throw new Error(
          "Config file must export a default config or named 'config' export"
        );
      }

      // 기본값과 병합
      return {
        ...DEFAULT_CONFIG,
        ...config,
        googleSheets: {
          ...DEFAULT_CONFIG.googleSheets,
          ...(config.googleSheets || {}),
        },
      };
    } else {
      // JSON 파일 로드
      const fileContent = fs.readFileSync(absolutePath, "utf-8");
      const config = JSON.parse(fileContent);

      // 기본값과 병합
      return {
        ...DEFAULT_CONFIG,
        ...config,
        googleSheets: {
          ...DEFAULT_CONFIG.googleSheets,
          ...(config.googleSheets || {}),
        },
      };
    }
  } catch (error) {
    if (!options?.silent) {
      console.warn(
        `⚠️  Failed to load config file, using default configuration:`,
        error
      );
    }
    return DEFAULT_CONFIG;
  }
}

/**
 * i18nexus.config 파일을 동기적으로 로드합니다 (JSON만 지원).
 * TypeScript/JavaScript config는 loadConfig를 사용하세요.
 */
export function loadConfigSync(
  configPath: string = "i18nexus.config.json",
  options?: { silent?: boolean }
): I18nexusConfig {
  const absolutePath = pathLib.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    if (!options?.silent) {
      console.log(
        "⚠️  i18nexus.config.json not found, using default configuration"
      );
      console.log("💡 Run 'i18n-sheets init' to create a config file");
    }
    return DEFAULT_CONFIG;
  }

  try {
    // JSON 파일 로드
    const fileContent = fs.readFileSync(absolutePath, "utf-8");
    const config = JSON.parse(fileContent);

    // 기본값과 병합
    return {
      ...DEFAULT_CONFIG,
      ...config,
      googleSheets: {
        ...DEFAULT_CONFIG.googleSheets,
        ...(config.googleSheets || {}),
      },
    };
  } catch (error) {
    if (!options?.silent) {
      console.warn(
        `⚠️  Failed to load ${configPath}, using default configuration:`,
        error
      );
    }
    return DEFAULT_CONFIG;
  }
}

/**
 * i18nexus.config 파일을 조용히 로드합니다 (로그 출력 없음).
 * 서버 환경에서 사용하기 적합합니다.
 */
export async function loadConfigSilently(
  configPath?: string
): Promise<I18nexusConfig> {
  return loadConfig(configPath, { silent: true });
}

/**
 * i18nexus.config.json 파일을 동기적으로 조용히 로드합니다.
 */
export function loadConfigSilentlySync(
  configPath: string = "i18nexus.config.json"
): I18nexusConfig {
  return loadConfigSync(configPath, { silent: true });
}

#!/usr/bin/env node

import * as fs from "fs";
import * as pathLib from "path";

export interface I18nexusConfig {
  languages: string[];
  defaultLanguage: string;
  localesDir: string;
  sourcePattern: string;
  googleSheets?: {
    spreadsheetId: string;
    credentialsPath: string;
    sheetName: string;
  };
}

const DEFAULT_CONFIG: I18nexusConfig = {
  languages: ["en", "ko"],
  defaultLanguage: "ko",
  localesDir: "./locales",
  sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
  googleSheets: {
    spreadsheetId: "",
    credentialsPath: "./credentials.json",
    sheetName: "Translations",
  },
};

/**
 * i18nexus.config.json 파일을 로드합니다.
 * 파일이 없으면 기본 설정을 반환합니다.
 */
export function loadConfig(
  configPath: string = "i18nexus.config.json"
): I18nexusConfig {
  const absolutePath = pathLib.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    console.log(
      "⚠️  i18nexus.config.json not found, using default configuration"
    );
    console.log("💡 Run 'i18n-sheets init' to create a config file");
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
    console.warn(
      `⚠️  Failed to load ${configPath}, using default configuration:`,
      error
    );
    return DEFAULT_CONFIG;
  }
}

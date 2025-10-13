#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { GoogleSheetsManager } from "../scripts/google-sheets";

export interface DownloadConfig {
  credentialsPath?: string;
  spreadsheetId?: string;
  localesDir?: string;
  sheetName?: string;
  languages?: string[];
}

const DEFAULT_CONFIG: Required<DownloadConfig> = {
  credentialsPath: "./credentials.json",
  spreadsheetId: "",
  localesDir: "./locales",
  sheetName: "Translations",
  languages: ["en", "ko"],
};

export async function downloadTranslations(
  config: Partial<DownloadConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    console.log("📥 Starting translation download from Google Sheets...");

    // 설정 유효성 검사
    if (!finalConfig.spreadsheetId) {
      console.error("❌ Spreadsheet ID is required");
      process.exit(1);
    }

    if (!fs.existsSync(finalConfig.credentialsPath)) {
      console.error(
        `❌ Credentials file not found: ${finalConfig.credentialsPath}`
      );
      process.exit(1);
    }

    // Google Sheets Manager 초기화
    const sheetsManager = new GoogleSheetsManager({
      credentialsPath: finalConfig.credentialsPath,
      spreadsheetId: finalConfig.spreadsheetId,
      sheetName: finalConfig.sheetName,
    });

    // 인증
    await sheetsManager.authenticate();

    // 번역 파일 다운로드
    await sheetsManager.saveTranslationsToLocal(
      finalConfig.localesDir,
      finalConfig.languages
    );

    console.log("✅ Translation download completed successfully");
  } catch (error) {
    console.error("❌ Download failed:", error);
    process.exit(1);
  }
}

// CLI 실행 부분
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<DownloadConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--credentials":
      case "-c":
        config.credentialsPath = args[++i];
        break;
      case "--spreadsheet-id":
      case "-s":
        config.spreadsheetId = args[++i];
        break;
      case "--locales-dir":
      case "-l":
        config.localesDir = args[++i];
        break;
      case "--sheet-name":
      case "-n":
        config.sheetName = args[++i];
        break;
      case "--languages":
        config.languages = args[++i].split(",");
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: i18n-download [options]

Options:
  -c, --credentials <path>     Path to Google Sheets credentials file (default: "./credentials.json")
  -s, --spreadsheet-id <id>    Google Spreadsheet ID (required)
  -l, --locales-dir <path>     Path to locales directory (default: "./locales")
  -n, --sheet-name <name>      Sheet name (default: "Translations")
  --languages <langs>          Comma-separated list of languages (default: "en,ko")
  -h, --help                   Show this help message

Examples:
  i18n-download -s "your-spreadsheet-id"
  i18n-download -c "./my-creds.json" -s "your-spreadsheet-id" -l "./translations"
  i18n-download -s "your-spreadsheet-id" --languages "en,ko,ja"
        `);
        process.exit(0);
        break;
    }
  }

  downloadTranslations(config).catch(console.error);
}

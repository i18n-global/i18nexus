#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { GoogleSheetsManager } from "../scripts/google-sheets";

export interface UploadConfig {
  credentialsPath?: string;
  spreadsheetId?: string;
  localesDir?: string;
  sheetName?: string;
}

const DEFAULT_CONFIG: Required<UploadConfig> = {
  credentialsPath: "./credentials.json",
  spreadsheetId: "",
  localesDir: "./locales",
  sheetName: "Translations",
};

export async function uploadTranslations(config: Partial<UploadConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    console.log("📤 Starting translation upload to Google Sheets...");

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

    if (!fs.existsSync(finalConfig.localesDir)) {
      console.error(
        `❌ Locales directory not found: ${finalConfig.localesDir}`
      );
      process.exit(1);
    }

    // Google Sheets Manager 초기화
    const sheetsManager = new GoogleSheetsManager({
      credentialsPath: finalConfig.credentialsPath,
      spreadsheetId: finalConfig.spreadsheetId,
      sheetName: finalConfig.sheetName,
    });

    // 인증 및 워크시트 확인
    await sheetsManager.authenticate();
    await sheetsManager.ensureWorksheet();

    // 번역 파일 업로드
    await sheetsManager.uploadTranslations(finalConfig.localesDir);

    console.log("✅ Translation upload completed successfully");
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
}

// CLI 실행 부분
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<UploadConfig> = {};

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
      case "--help":
      case "-h":
        console.log(`
Usage: i18n-upload [options]

Options:
  -c, --credentials <path>     Path to Google Sheets credentials file (default: "./credentials.json")
  -s, --spreadsheet-id <id>    Google Spreadsheet ID (required)
  -l, --locales-dir <path>     Path to locales directory (default: "./locales")
  -n, --sheet-name <name>      Sheet name (default: "Translations")
  -h, --help                   Show this help message

Examples:
  i18n-upload -s "your-spreadsheet-id"
  i18n-upload -c "./my-creds.json" -s "your-spreadsheet-id" -l "./translations"
        `);
        process.exit(0);
        break;
    }
  }

  uploadTranslations(config).catch(console.error);
}

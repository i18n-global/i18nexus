#!/usr/bin/env node

import { Command } from "commander";
import {
  GoogleSheetsManager,
  GoogleSheetsConfig,
} from "../scripts/google-sheets";
import { loadConfig } from "../scripts/config-loader";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

// i18nexus.config.js에서 설정 로드 (init 명령 제외)
let projectConfig: ReturnType<typeof loadConfig> | null = null;
try {
  if (!process.argv.includes("init")) {
    projectConfig = loadConfig();
  }
} catch (error) {
  // init 명령이 아닐 때만 경고
  if (!process.argv.includes("init")) {
    console.warn("⚠️  Could not load config, using command line options");
  }
}

program
  .name("i18n-sheets")
  .description("Google Sheets integration for i18n translations")
  .version("1.0.0");

// 공통 옵션들
const addCommonOptions = (cmd: Command) => {
  return cmd
    .option(
      "-c, --credentials <path>",
      "Path to Google service account credentials JSON file",
      projectConfig?.googleSheets?.credentialsPath || "./credentials.json",
    )
    .option(
      "-s, --spreadsheet <id>",
      "Google Spreadsheet ID",
      projectConfig?.googleSheets?.spreadsheetId,
    )
    .option(
      "-w, --worksheet <name>",
      "Worksheet name",
      projectConfig?.googleSheets?.sheetName || "Translations",
    )
    .option(
      "-l, --locales <dir>",
      "Locales directory",
      projectConfig?.localesDir || "./locales",
    );
};

// 환경 설정 확인
const checkConfig = (options: any): GoogleSheetsConfig => {
  const spreadsheetId =
    options.spreadsheet || projectConfig?.googleSheets?.spreadsheetId;
  const credentialsPath =
    options.credentials ||
    projectConfig?.googleSheets?.credentialsPath ||
    "./credentials.json";

  if (!spreadsheetId) {
    console.error(
      "❌ Spreadsheet ID is required. Use -s option, set in i18nexus.config.js, or set GOOGLE_SPREADSHEET_ID environment variable.",
    );
    process.exit(1);
  }

  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Credentials file not found: ${credentialsPath}`);
    console.error(
      "Please download your Google Service Account key file and specify its path with -c option or in i18nexus.config.js.",
    );
    process.exit(1);
  }

  return {
    credentialsPath,
    spreadsheetId,
    sheetName: options.worksheet,
  };
};

// 업로드 명령
addCommonOptions(
  program
    .command("upload")
    .description("Upload local translation files to Google Sheets")
    .option("-f, --force", "Force upload even if keys already exist"),
).action(async (options) => {
  try {
    console.log("📤 Starting upload to Google Sheets...");

    const config = checkConfig(options);
    const manager = new GoogleSheetsManager(config);

    await manager.authenticate();
    await manager.ensureWorksheet();
    await manager.uploadTranslations(options.locales);

    console.log("✅ Upload completed successfully");
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
});

// 다운로드 명령
addCommonOptions(
  program
    .command("download")
    .description("Download translations from Google Sheets to local files")
    .option(
      "--languages <langs>",
      "Comma-separated list of languages",
      projectConfig?.languages.join(",") || "en,ko",
    ),
).action(async (options) => {
  try {
    console.log("📥 Starting download from Google Sheets...");

    const config = checkConfig(options);
    const manager = new GoogleSheetsManager(config);
    const languages = options.languages.split(",").map((l: string) => l.trim());

    await manager.authenticate();
    await manager.saveTranslationsToLocal(options.locales, languages);

    // index.ts 생성
    const indexPath = path.join(options.locales, "index.ts");
    const imports = languages
      .map((lang: string) => `import ${lang} from "./${lang}.json";`)
      .join("\n");
    const exportObj = languages
      .map((lang: string) => `  ${lang}: ${lang},`)
      .join("\n");
    const indexContent = `${imports}

export const translations = {
${exportObj}
};
`;
    fs.writeFileSync(indexPath, indexContent);
    console.log(`📝 Generated ${indexPath}`);

    console.log("✅ Download completed successfully");
  } catch (error) {
    console.error("❌ Download failed:", error);
    process.exit(1);
  }
});

// 동기화 명령
addCommonOptions(
  program
    .command("sync")
    .description("Bidirectional sync between local files and Google Sheets"),
).action(async (options) => {
  try {
    console.log("🔄 Starting bidirectional sync...");

    const config = checkConfig(options);
    const manager = new GoogleSheetsManager(config);

    await manager.authenticate();
    await manager.ensureWorksheet();
    await manager.syncTranslations(options.locales);

    console.log("✅ Sync completed successfully");
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
});

// 상태 확인 명령
addCommonOptions(
  program
    .command("status")
    .description("Show Google Sheets status and statistics"),
).action(async (options) => {
  try {
    console.log("📊 Checking Google Sheets status...");

    const config = checkConfig(options);
    const manager = new GoogleSheetsManager(config);

    await manager.authenticate();
    const status = await manager.getStatus();

    console.log("\n📋 Google Sheets Status:");
    console.log(`   Spreadsheet ID: ${status.spreadsheetId}`);
    console.log(`   Worksheet: ${status.sheetName}`);
    console.log(`   Total translations: ${status.totalRows}`);

    // 로컬 파일 상태도 확인
    if (fs.existsSync(options.locales)) {
      const languages = fs
        .readdirSync(options.locales)
        .filter((item) =>
          fs.statSync(path.join(options.locales, item)).isDirectory(),
        );

      console.log(`\n📁 Local Files Status:`);
      console.log(`   Locales directory: ${options.locales}`);
      console.log(`   Languages: ${languages.join(", ")}`);

      languages.forEach((lang) => {
        const langDir = path.join(options.locales, lang);
        const files = fs
          .readdirSync(langDir)
          .filter((f) => f.endsWith(".json"));
        let totalKeys = 0;

        files.forEach((file) => {
          const content = JSON.parse(
            fs.readFileSync(path.join(langDir, file), "utf-8"),
          );
          totalKeys += Object.keys(content).length;
        });

        console.log(`   ${lang}: ${totalKeys} keys in ${files.length} files`);
      });
    } else {
      console.log(`\n📁 Local Files Status:`);
      console.log(`   Locales directory not found: ${options.locales}`);
    }
  } catch (error) {
    console.error("❌ Status check failed:", error);
    process.exit(1);
  }
});

// 초기 설정 명령
program
  .command("init")
  .description("Initialize i18nexus project with config and translation files")
  .option("-s, --spreadsheet <id>", "Google Spreadsheet ID (optional)")
  .option(
    "-c, --credentials <path>",
    "Path to credentials file",
    "./credentials.json",
  )
  .option("-l, --locales <dir>", "Locales directory", "./locales")
  .option("--languages <langs>", "Comma-separated list of languages", "en,ko")
  .action(async (options) => {
    try {
      console.log("🚀 Initializing i18nexus project...");

      const languages = options.languages
        .split(",")
        .map((l: string) => l.trim());

      // 1. i18nexus.config.json 생성 (쉽게 로드 가능)
      const configData = {
        languages: languages,
        defaultLanguage: languages[0],
        localesDir: options.locales,
        sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
        googleSheets: {
          spreadsheetId: options.spreadsheet || "",
          credentialsPath: options.credentials,
          sheetName: "Translations",
        },
      };

      fs.writeFileSync(
        "i18nexus.config.json",
        JSON.stringify(configData, null, 2),
      );
      console.log("✅ Created i18nexus.config.json");

      // 2. locales 디렉토리 생성
      if (!fs.existsSync(options.locales)) {
        fs.mkdirSync(options.locales, { recursive: true });
        console.log(`✅ Created ${options.locales} directory`);
      }

      // 3. 각 언어별 번역 파일 생성
      languages.forEach((lang: string) => {
        const langFile = path.join(options.locales, `${lang}.json`);
        if (!fs.existsSync(langFile)) {
          fs.writeFileSync(langFile, JSON.stringify({}, null, 2));
          console.log(`✅ Created ${langFile}`);
        } else {
          console.log(`⚠️  ${langFile} already exists, skipping...`);
        }
      });

      // 4. index.ts 파일 생성
      const indexPath = path.join(options.locales, "index.ts");
      if (!fs.existsSync(indexPath)) {
        const imports = languages
          .map((lang: string) => `import ${lang} from "./${lang}.json";`)
          .join("\n");
        const exportObj = languages
          .map((lang: string) => `  ${lang}: ${lang},`)
          .join("\n");
        const indexContent = `${imports}

export const translations = {
${exportObj}
};
`;
        fs.writeFileSync(indexPath, indexContent);
        console.log(`✅ Created ${indexPath}`);
      } else {
        console.log(`⚠️  ${indexPath} already exists, skipping...`);
      }

      // 5. Google Sheets 연동 설정 (옵션)
      if (options.spreadsheet) {
        // credentials.json 파일 확인
        if (!fs.existsSync(options.credentials)) {
          console.log("\n📝 Google Service Account Setup:");
          console.log(
            "1. Go to Google Cloud Console (https://console.cloud.google.com/)",
          );
          console.log("2. Create a new project or select existing one");
          console.log("3. Enable Google Sheets API");
          console.log("4. Create a Service Account");
          console.log("5. Download the JSON key file");
          console.log(`6. Save it as '${options.credentials}'`);
          console.log("\n📋 Spreadsheet Setup:");
          console.log("1. Create a new Google Spreadsheet");
          console.log("2. Share it with your service account email");
          console.log("3. Copy the spreadsheet ID from the URL");

          console.log(
            "\n⚠️  Please add the credentials file and try again for Google Sheets integration.",
          );
        } else {
          // 설정 테스트
          const config = {
            credentialsPath: options.credentials,
            spreadsheetId: options.spreadsheet,
            sheetName: "Translations",
          };

          const manager = new GoogleSheetsManager(config);
          await manager.authenticate();

          const canAccess = await manager.checkSpreadsheet();
          if (!canAccess) {
            console.error("❌ Cannot access the spreadsheet. Please check:");
            console.error("   1. Spreadsheet ID is correct");
            console.error(
              "   2. Service account has access to the spreadsheet",
            );
          } else {
            await manager.ensureWorksheet();

            // 환경 파일 생성
            const envContent = `# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=${options.spreadsheet}
GOOGLE_CREDENTIALS_PATH=${options.credentials}
`;
            fs.writeFileSync(".env.sheets", envContent);
            console.log("✅ Google Sheets integration configured");
            console.log(`📋 Spreadsheet ID: ${options.spreadsheet}`);
            console.log(`🔑 Credentials: ${options.credentials}`);
          }
        }
      }

      console.log("\n✅ i18nexus project initialized successfully!");
      console.log("\n📝 Next steps:");
      console.log("1. Update i18nexus.config.json with your project settings");
      console.log("2. Run 'i18n-wrapper' to wrap hardcoded strings");
      console.log(
        "3. Run 'i18n-extractor' to extract translation keys to en.json and ko.json",
      );
      if (options.spreadsheet) {
        console.log("4. Run 'i18n-sheets upload' to sync with Google Sheets");
      }
    } catch (error) {
      console.error("❌ Initialization failed:", error);
      process.exit(1);
    }
  });

// 도움말 개선
program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log(
    "  $ i18n-sheets init                                          # Initialize project without Google Sheets",
  );
  console.log(
    "  $ i18n-sheets init -s 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms  # Initialize with Google Sheets",
  );
  console.log(
    "  $ i18n-sheets upload -s 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  );
  console.log(
    "  $ i18n-sheets download -s 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  );
  console.log(
    "  $ i18n-sheets sync -s 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  );
  console.log(
    "  $ i18n-sheets status -s 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  );
  console.log("");
  console.log("Environment Variables:");
  console.log("  GOOGLE_SPREADSHEET_ID    Google Spreadsheet ID");
  console.log("  GOOGLE_CREDENTIALS_PATH  Path to service account credentials");
  console.log("");
});

// CSV 변환 명령
program
  .command("csv-to-json")
  .description("Convert CSV file to local JSON translation files")
  .option("-f, --csv-file <path>", "Path to CSV file", "./translations.csv")
  .option("-l, --locales <dir>", "Locales directory", "./locales")
  .option("--languages <langs>", "Comma-separated list of languages", "en,ko")
  .action(async (options) => {
    try {
      console.log("📥 Converting CSV to JSON translations...");

      const manager = new GoogleSheetsManager();
      const languages = options.languages
        .split(",")
        .map((l: string) => l.trim());

      await manager.convertCSVToLocalTranslations(
        options.csvFile,
        options.locales,
        languages,
      );

      console.log("✅ CSV to JSON conversion completed successfully");
    } catch (error) {
      console.error("❌ CSV conversion failed:", error);
      process.exit(1);
    }
  });

program
  .command("json-to-csv")
  .description("Convert local JSON translation files to CSV file")
  .option("-f, --csv-file <path>", "Output CSV file path", "./translations.csv")
  .option("-l, --locales <dir>", "Locales directory", "./locales")
  .action(async (options) => {
    try {
      console.log("📤 Converting JSON translations to CSV...");

      const manager = new GoogleSheetsManager();

      // 로컬 번역 파일들 읽기
      const translations = await manager.readLocalTranslations(options.locales);

      // CSV로 저장
      await manager.saveTranslationsToCSV(options.csvFile, translations);

      console.log("✅ JSON to CSV conversion completed successfully");
    } catch (error) {
      console.error("❌ JSON to CSV conversion failed:", error);
      process.exit(1);
    }
  });

// 환경 변수에서 기본값 읽기
if (process.env.GOOGLE_SPREADSHEET_ID) {
  program.setOptionValue("spreadsheet", process.env.GOOGLE_SPREADSHEET_ID);
}

if (process.env.GOOGLE_CREDENTIALS_PATH) {
  program.setOptionValue("credentials", process.env.GOOGLE_CREDENTIALS_PATH);
}

program.parse();

import { google, sheets_v4 } from "googleapis";
import * as fs from "fs";
import * as path from "path";

export interface GoogleSheetsConfig {
  credentialsPath?: string;
  spreadsheetId?: string;
  sheetName?: string;
  keyColumn?: string;
  valueColumns?: string[];
  headerRow?: number;
}

export interface TranslationRow {
  key: string;
  [language: string]: string;
}

export class GoogleSheetsManager {
  private sheets: sheets_v4.Sheets | null = null;
  private config: Required<GoogleSheetsConfig>;

  constructor(config: Partial<GoogleSheetsConfig> = {}) {
    this.config = {
      credentialsPath: config.credentialsPath || "./credentials.json",
      spreadsheetId: config.spreadsheetId || "",
      sheetName: config.sheetName || "Translations",
      keyColumn: config.keyColumn || "A",
      valueColumns: config.valueColumns || ["B", "C"], // B=English, C=Korean
      headerRow: config.headerRow || 1,
    };
  }

  /**
   * Google Sheets API 인증 및 초기화
   */
  async authenticate(): Promise<void> {
    try {
      // 서비스 계정 키 파일 읽기
      if (!fs.existsSync(this.config.credentialsPath)) {
        throw new Error(
          `Credentials file not found: ${this.config.credentialsPath}`,
        );
      }

      const credentials = JSON.parse(
        fs.readFileSync(this.config.credentialsPath, "utf8"),
      );

      // JWT 클라이언트 생성
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const authClient = await auth.getClient();

      // Sheets API 클라이언트 생성
      this.sheets = google.sheets({ version: "v4", auth: authClient as any });

      console.log("✅ Google Sheets API authenticated successfully");
    } catch (error) {
      console.error("❌ Failed to authenticate Google Sheets API:", error);
      throw error;
    }
  }

  /**
   * 스프레드시트가 존재하는지 확인
   */
  async checkSpreadsheet(): Promise<boolean> {
    if (!this.sheets) {
      throw new Error(
        "Google Sheets client not initialized. Call authenticate() first.",
      );
    }

    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });
      return true;
    } catch (error) {
      console.error("❌ Spreadsheet not accessible:", error);
      return false;
    }
  }

  /**
   * 워크시트가 존재하는지 확인하고, 없으면 생성
   */
  async ensureWorksheet(): Promise<void> {
    if (!this.sheets) {
      throw new Error(
        "Google Sheets client not initialized. Call authenticate() first.",
      );
    }

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === this.config.sheetName,
      );

      if (!sheetExists) {
        console.log(`📝 Creating worksheet: ${this.config.sheetName}`);

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.config.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: this.config.sheetName,
                  },
                },
              },
            ],
          },
        });

        // 헤더 행 추가
        await this.addHeaders();
      }
    } catch (error) {
      console.error("❌ Failed to ensure worksheet:", error);
      throw error;
    }
  }

  /**
   * 헤더 행 추가
   */
  private async addHeaders(): Promise<void> {
    if (!this.sheets) return;

    const headers = ["Key", "English", "Korean"];
    const range = `${this.config.sheetName}!A${this.config.headerRow}:C${this.config.headerRow}`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.config.spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    });

    console.log("📝 Headers added to worksheet");
  }

  /**
   * 로컬 번역 파일들을 읽어서 Google Sheets에 업로드
   */
  async uploadTranslations(localesDir: string): Promise<void> {
    if (!this.sheets) {
      throw new Error(
        "Google Sheets client not initialized. Call authenticate() first.",
      );
    }

    try {
      console.log("📤 Uploading translations to Google Sheets...");

      // 기존 데이터 읽기
      const existingData = await this.downloadTranslations();
      const existingKeys = new Set(existingData.map((row) => row.key));

      // 로컬 번역 파일들 읽기
      const translations = await this.readLocalTranslations(localesDir);

      if (translations.length === 0) {
        console.log("📝 No translation files found");
        return;
      }

      // 새로운 키만 필터링
      const newTranslations = translations.filter(
        (t) => !existingKeys.has(t.key),
      );

      if (newTranslations.length === 0) {
        console.log("📝 No new translations to upload");
        return;
      }

      // 데이터 준비
      const values = newTranslations.map((translation) => [
        translation.key,
        translation.en || "",
        translation.ko || "",
      ]);

      // 마지막 행 찾기
      const lastRow = Math.max(
        this.config.headerRow,
        existingData.length + this.config.headerRow,
      );
      const startRow = lastRow + 1;
      const endRow = startRow + values.length - 1;
      const range = `${this.config.sheetName}!A${startRow}:C${endRow}`;

      // 데이터 업로드
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      });

      console.log(
        `✅ Uploaded ${newTranslations.length} new translations to Google Sheets`,
      );
    } catch (error) {
      console.error("❌ Failed to upload translations:", error);
      throw error;
    }
  }

  /**
   * Google Sheets에서 번역 데이터 다운로드
   */
  async downloadTranslations(): Promise<TranslationRow[]> {
    if (!this.sheets) {
      throw new Error(
        "Google Sheets client not initialized. Call authenticate() first.",
      );
    }

    try {
      console.log("📥 Downloading translations from Google Sheets...");

      const range = `${this.config.sheetName}!A:C`;
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];

      if (rows.length <= this.config.headerRow) {
        console.log("📝 No translation data found");
        return [];
      }

      // 헤더 행 제외하고 데이터 파싱
      const dataRows = rows.slice(this.config.headerRow);
      const translations: TranslationRow[] = dataRows
        .filter((row) => row[0]) // 키가 있는 행만
        .map((row) => ({
          key: row[0] || "",
          en: row[1] || "",
          ko: row[2] || "",
        }));

      console.log(
        `✅ Downloaded ${translations.length} translations from Google Sheets`,
      );
      return translations;
    } catch (error) {
      console.error("❌ Failed to download translations:", error);
      throw error;
    }
  }

  /**
   * Google Sheets 데이터를 로컬 번역 파일로 저장
   */
  async saveTranslationsToLocal(
    localesDir: string,
    languages: string[] = ["en", "ko"],
  ): Promise<void> {
    try {
      const translations = await this.downloadTranslations();

      if (translations.length === 0) {
        console.log("📝 No translations to save");
        return;
      }

      // 언어별로 번역 파일 생성
      for (const lang of languages) {
        const langDir = path.join(localesDir, lang);
        if (!fs.existsSync(langDir)) {
          fs.mkdirSync(langDir, { recursive: true });
        }

        const translationObj: Record<string, string> = {};
        translations.forEach((row) => {
          if (row[lang]) {
            translationObj[row.key] = row[lang];
          }
        });

        const filePath = path.join(langDir, "common.json");
        fs.writeFileSync(
          filePath,
          JSON.stringify(translationObj, null, 2),
          "utf-8",
        );

        console.log(
          `📝 Saved ${Object.keys(translationObj).length} ${lang} translations to ${filePath}`,
        );
      }
    } catch (error) {
      console.error("❌ Failed to save translations to local:", error);
      throw error;
    }
  }

  /**
   * 로컬 번역 파일들 읽기
   */
  private async readLocalTranslations(
    localesDir: string,
  ): Promise<TranslationRow[]> {
    const translations: TranslationRow[] = [];
    const allKeys = new Set<string>();

    // 지원 언어 디렉토리 찾기
    const languages = fs
      .readdirSync(localesDir)
      .filter((item) => fs.statSync(path.join(localesDir, item)).isDirectory());

    // 각 언어의 번역 파일들 읽기
    const translationData: Record<string, Record<string, string>> = {};

    for (const lang of languages) {
      const langDir = path.join(localesDir, lang);
      const files = fs
        .readdirSync(langDir)
        .filter((file) => file.endsWith(".json"));

      translationData[lang] = {};

      for (const file of files) {
        const filePath = path.join(langDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        Object.entries(content).forEach(([key, value]) => {
          translationData[lang][key] = value as string;
          allKeys.add(key);
        });
      }
    }

    // 모든 키에 대해 번역 행 생성
    allKeys.forEach((key) => {
      const row: TranslationRow = { key };
      languages.forEach((lang) => {
        row[lang] = translationData[lang][key] || "";
      });
      translations.push(row);
    });

    return translations;
  }

  /**
   * 양방향 동기화 - 로컬과 Google Sheets 간의 차이점 해결
   */
  async syncTranslations(localesDir: string): Promise<void> {
    try {
      console.log("🔄 Starting bidirectional sync...");

      // 로컬과 원격 데이터 읽기
      const [localTranslations, remoteTranslations] = await Promise.all([
        this.readLocalTranslations(localesDir),
        this.downloadTranslations(),
      ]);

      const localKeys = new Set(localTranslations.map((t) => t.key));
      const remoteKeys = new Set(remoteTranslations.map((t) => t.key));

      // 새로운 로컬 키들을 Google Sheets에 업로드
      const newLocalKeys = localTranslations.filter(
        (t) => !remoteKeys.has(t.key),
      );
      if (newLocalKeys.length > 0) {
        console.log(
          `📤 Uploading ${newLocalKeys.length} new local keys to Google Sheets`,
        );
        await this.uploadNewTranslations(newLocalKeys);
      }

      // 새로운 원격 키들을 로컬에 다운로드
      const newRemoteKeys = remoteTranslations.filter(
        (t) => !localKeys.has(t.key),
      );
      if (newRemoteKeys.length > 0) {
        console.log(
          `📥 Downloading ${newRemoteKeys.length} new remote keys to local files`,
        );
        await this.addTranslationsToLocal(localesDir, newRemoteKeys);
      }

      console.log("✅ Sync completed successfully");
    } catch (error) {
      console.error("❌ Failed to sync translations:", error);
      throw error;
    }
  }

  /**
   * 새로운 번역들을 Google Sheets에 추가
   */
  private async uploadNewTranslations(
    translations: TranslationRow[],
  ): Promise<void> {
    if (!this.sheets || translations.length === 0) return;

    const values = translations.map((t) => [t.key, t.en || "", t.ko || ""]);

    // 기존 데이터의 마지막 행 찾기
    const existingData = await this.downloadTranslations();
    const startRow = existingData.length + this.config.headerRow + 1;
    const endRow = startRow + values.length - 1;
    const range = `${this.config.sheetName}!A${startRow}:C${endRow}`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.config.spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });
  }

  /**
   * 새로운 번역들을 로컬 파일에 추가
   */
  private async addTranslationsToLocal(
    localesDir: string,
    translations: TranslationRow[],
  ): Promise<void> {
    const languages = ["en", "ko"];

    for (const lang of languages) {
      const langDir = path.join(localesDir, lang);
      const filePath = path.join(langDir, "common.json");

      // 기존 번역 읽기
      let existingTranslations: Record<string, string> = {};
      if (fs.existsSync(filePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }

      // 새로운 번역 추가
      translations.forEach((t) => {
        if (t[lang]) {
          existingTranslations[t.key] = t[lang];
        }
      });

      // 파일 저장
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      fs.writeFileSync(
        filePath,
        JSON.stringify(existingTranslations, null, 2),
        "utf-8",
      );
    }
  }

  /**
   * 스프레드시트 상태 확인
   */
  async getStatus(): Promise<{
    spreadsheetId: string;
    sheetName: string;
    totalRows: number;
    lastUpdated?: string;
  }> {
    if (!this.sheets) {
      throw new Error(
        "Google Sheets client not initialized. Call authenticate() first.",
      );
    }

    try {
      const [spreadsheet, values] = await Promise.all([
        this.sheets.spreadsheets.get({
          spreadsheetId: this.config.spreadsheetId,
        }),
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.sheetName}!A:A`,
        }),
      ]);

      const totalRows =
        (values.data.values?.length || 0) - this.config.headerRow;

      return {
        spreadsheetId: this.config.spreadsheetId,
        sheetName: this.config.sheetName,
        totalRows: Math.max(0, totalRows),
        lastUpdated: spreadsheet.data.properties?.timeZone || undefined,
      };
    } catch (error) {
      console.error("❌ Failed to get status:", error);
      throw error;
    }
  }
}

// 기본 인스턴스
export const defaultGoogleSheetsManager = new GoogleSheetsManager();

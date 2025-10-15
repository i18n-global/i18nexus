#!/usr/bin/env node

import * as fs from "fs";
import * as pathLib from "path";
import { glob } from "glob";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export interface ExtractorConfig {
  sourcePattern?: string;
  outputFile?: string;
  outputDir?: string;
  namespace?: string;
  includeLineNumbers?: boolean;
  includeFilePaths?: boolean;
  sortKeys?: boolean;
  dryRun?: boolean;
  outputFormat?: "json" | "csv";
  languages?: string[]; // 언어 목록 추가
}

const DEFAULT_CONFIG: Required<ExtractorConfig> = {
  sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
  outputFile: "extracted-translations.json",
  outputDir: "./locales",
  namespace: "",
  includeLineNumbers: false,
  includeFilePaths: false,
  sortKeys: true,
  dryRun: false,
  outputFormat: "json",
  languages: ["en", "ko"], // 기본 언어
};

export interface ExtractedKey {
  key: string;
  defaultValue?: string;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export class TranslationExtractor {
  private config: Required<ExtractorConfig>;
  private extractedKeys: Map<string, ExtractedKey> = new Map();

  constructor(config: Partial<ExtractorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private parseFile(filePath: string): void {
    try {
      const code = fs.readFileSync(filePath, "utf-8");

      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: [
          "jsx",
          "typescript",
          "decorators-legacy",
          "classProperties",
          "objectRestSpread",
          "asyncGenerators",
          "functionBind",
          "exportDefaultFrom",
          "exportNamespaceFrom",
          "dynamicImport",
        ],
      });

      traverse(ast, {
        CallExpression: (path) => {
          this.extractTranslationKey(path, filePath);
        },
      });
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${filePath}:`, error);
    }
  }

  private extractTranslationKey(
    path: NodePath<t.CallExpression>,
    filePath: string
  ): void {
    const { node } = path;

    // t() 함수 호출 감지
    if (!this.isTFunction(node.callee)) {
      return;
    }

    // 첫 번째 인수가 문자열인지 확인
    const firstArg = node.arguments[0];
    if (!t.isStringLiteral(firstArg)) {
      return;
    }

    const key = firstArg.value;
    const loc = node.loc;

    const extractedKey: ExtractedKey = {
      key,
      defaultValue: this.getDefaultValue(
        node.arguments.filter(
          (arg): arg is t.Expression =>
            !t.isArgumentPlaceholder(arg) && !t.isSpreadElement(arg)
        )
      ),
    };

    if (this.config.includeFilePaths) {
      extractedKey.filePath = pathLib.relative(process.cwd(), filePath);
    }

    if (this.config.includeLineNumbers && loc) {
      extractedKey.lineNumber = loc.start.line;
      extractedKey.columnNumber = loc.start.column;
    }

    // 중복 키 처리 - 첫 번째 발견된 것을 유지하거나 위치 정보 추가
    const existingKey = this.extractedKeys.get(key);
    if (existingKey) {
      // 동일한 키가 여러 곳에서 사용되는 경우 배열로 관리할 수도 있음
      console.log(`🔄 Duplicate key found: "${key}" in ${filePath}`);
    } else {
      this.extractedKeys.set(key, extractedKey);
    }
  }

  private isTFunction(callee: t.Expression | t.V8IntrinsicIdentifier): boolean {
    // t() 직접 호출
    if (t.isIdentifier(callee, { name: "t" })) {
      return true;
    }

    // useTranslation().t 형태의 호출
    if (
      t.isMemberExpression(callee) &&
      t.isIdentifier(callee.property, { name: "t" })
    ) {
      return true;
    }

    return false;
  }

  private getDefaultValue(args: t.Expression[]): string | undefined {
    // 두 번째 인수가 옵션 객체인 경우 defaultValue 추출
    if (args.length > 1 && t.isObjectExpression(args[1])) {
      const defaultValueProp = args[1].properties.find(
        (prop) =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key, { name: "defaultValue" }) &&
          t.isStringLiteral(prop.value)
      );

      if (defaultValueProp && t.isObjectProperty(defaultValueProp)) {
        return (defaultValueProp.value as t.StringLiteral).value;
      }
    }

    return undefined;
  }

  /**
   * Remove variable placeholders from a string
   * @param text - Text with {{variable}} placeholders
   * @returns Text with {{variable}} replaced with empty string
   */
  private removeVariablePlaceholders(text: string): string {
    return text.replace(/\{\{\w+\}\}/g, "");
  }

  private generateOutputData(): any {
    const keys = Array.from(this.extractedKeys.values());

    if (this.config.sortKeys) {
      keys.sort((a, b) => a.key.localeCompare(b.key));
    }

    if (this.config.outputFormat === "csv") {
      return this.generateGoogleSheetsCSV(keys);
    }

    // JSON 형식 - 단순화된 구조
    const result: { [key: string]: string } = {};

    keys.forEach(({ key, defaultValue }) => {
      // key를 그대로 사용하고, defaultValue가 있으면 사용, 없으면 key를 기본값으로
      const value = defaultValue || key;
      // {{variable}} 패턴이 있으면 빈 값으로 치환
      result[key] = this.removeVariablePlaceholders(value);
    });

    return result;
  }

  private generateGoogleSheetsCSV(keys: ExtractedKey[]): string {
    // CSV 헤더: Key, English, Korean
    const csvLines = ["Key,English,Korean"];

    keys.forEach(({ key, defaultValue }) => {
      // CSV 라인: key, 빈값(영어), defaultValue 또는 key(한국어)
      const englishValue = "";
      const koreanValue = defaultValue || key;
      // {{variable}} 패턴이 있으면 빈 값으로 치환
      const koreanValueCleaned = this.removeVariablePlaceholders(koreanValue);

      // CSV 이스케이프 처리
      const escapedKey = this.escapeCsvValue(key);
      const escapedEnglish = this.escapeCsvValue(englishValue);
      const escapedKorean = this.escapeCsvValue(koreanValueCleaned);

      csvLines.push(`${escapedKey},${escapedEnglish},${escapedKorean}`);
    });

    return csvLines.join("\n");
  }

  private escapeCsvValue(value: string): string {
    // CSV에서 특수 문자가 포함된 경우 따옴표로 감싸고, 따옴표는 두 번 반복
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private generateIndexFile(): void {
    const indexPath = pathLib.join(this.config.outputDir, "index.ts");

    // Import 문 생성
    const imports = this.config.languages
      .map((lang) => `import ${lang} from "./${lang}.json";`)
      .join("\n");

    // Export 객체 생성
    const exportObj = this.config.languages
      .map((lang) => `  ${lang}: ${lang},`)
      .join("\n");

    const content = `${imports}

export const translations = {
${exportObj}
};
`;

    if (!this.config.dryRun) {
      fs.writeFileSync(indexPath, content, "utf-8");
      console.log(`📝 Generated index file: ${indexPath}`);
    } else {
      console.log(`📄 Dry run - index file would be written to: ${indexPath}`);
    }
  }

  private writeOutputFile(data: any): void {
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    if (this.config.outputFormat === "csv") {
      // CSV 파일로 출력
      const csvFileName = this.config.outputFile.replace(/\.json$/, ".csv");
      const outputPath = pathLib.join(this.config.outputDir, csvFileName);
      const content = data; // CSV는 이미 문자열

      if (this.config.dryRun) {
        console.log("📄 Dry run - output would be written to:", outputPath);
        console.log("📄 Content preview:");
        console.log(content.substring(0, 500) + "...");
        return;
      }

      fs.writeFileSync(outputPath, content);
      console.log(`📝 Extracted translations written to: ${outputPath}`);
    } else {
      // JSON 파일로 출력 - 각 언어별로 파일 생성
      this.config.languages.forEach((lang) => {
        const langFile = pathLib.join(this.config.outputDir, `${lang}.json`);

        // 기존 번역 파일 읽기 (있다면)
        let existingTranslations: { [key: string]: string } = {};
        if (fs.existsSync(langFile)) {
          try {
            const existingContent = fs.readFileSync(langFile, "utf-8");
            existingTranslations = JSON.parse(existingContent);
          } catch (error) {
            console.warn(
              `⚠️  Failed to parse existing ${langFile}, will overwrite`
            );
          }
        }

        // 새로운 키 병합
        const mergedTranslations = { ...existingTranslations };

        Object.keys(data).forEach((key) => {
          if (lang === "ko") {
            // 한국어는 키를 그대로 또는 defaultValue 사용 ({{variable}} 패턴은 이미 제거됨)
            mergedTranslations[key] =
              data[key] || this.removeVariablePlaceholders(key);
          } else if (lang === "en") {
            // 영어는 기존 번역이 있으면 유지, 없으면 빈 문자열
            if (!mergedTranslations[key]) {
              mergedTranslations[key] = "";
            }
          } else {
            // 기타 언어도 기존 번역 유지, 없으면 빈 문자열
            if (!mergedTranslations[key]) {
              mergedTranslations[key] = "";
            }
          }
        });

        const content = JSON.stringify(mergedTranslations, null, 2);

        if (this.config.dryRun) {
          console.log(`📄 Dry run - output would be written to: ${langFile}`);
          console.log(`📄 Content preview (${lang}):`);
          console.log(content.substring(0, 500) + "...");
        } else {
          fs.writeFileSync(langFile, content);
          console.log(`📝 Extracted translations written to: ${langFile}`);
        }
      });

      // index.ts 파일 생성
      this.generateIndexFile();
    }
  }

  public async extract(): Promise<void> {
    console.log("🔍 Starting translation key extraction...");
    console.log(`📁 Pattern: ${this.config.sourcePattern}`);

    try {
      const files = await glob(this.config.sourcePattern);

      if (files.length === 0) {
        console.warn(
          "⚠️  No files found matching pattern:",
          this.config.sourcePattern
        );
        return;
      }

      console.log(`📂 Found ${files.length} files to analyze`);

      // 파일 분석
      files.forEach((file) => {
        console.log(`📄 Analyzing: ${file}`);
        this.parseFile(file);
      });

      // 결과 생성
      const outputData = this.generateOutputData();

      console.log(
        `🔑 Found ${this.extractedKeys.size} unique translation keys`
      );

      // 출력 파일 작성
      this.writeOutputFile(outputData);

      console.log("✅ Translation extraction completed");
    } catch (error) {
      console.error("❌ Extraction failed:", error);
      throw error;
    }
  }
}

export async function runTranslationExtractor(
  config: Partial<ExtractorConfig> = {}
): Promise<void> {
  const extractor = new TranslationExtractor(config);
  await extractor.extract();
}

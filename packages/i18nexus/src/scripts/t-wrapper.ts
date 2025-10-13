#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

export interface ScriptConfig {
  sourcePattern?: string;
  translationImportSource?: string;
  dryRun?: boolean;
}

const DEFAULT_CONFIG: Required<ScriptConfig> = {
  sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
  translationImportSource: "i18nexus",
  dryRun: false,
};

export class TranslationWrapper {
  private config: Required<ScriptConfig>;

  constructor(config: Partial<ScriptConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private createUseTranslationHook(): t.VariableDeclaration {
    // useTranslation()을 빈 값으로 호출 - 내부적으로 현재 언어 자동 주입
    const hookCall = t.callExpression(t.identifier("useTranslation"), []);

    return t.variableDeclaration("const", [
      t.variableDeclarator(
        t.objectPattern([
          t.objectProperty(t.identifier("t"), t.identifier("t"), false, true),
        ]),
        hookCall
      ),
    ]);
  }

  private shouldSkipPath(path: NodePath<t.StringLiteral>): boolean {
    // t() 함수로 이미 래핑된 경우 스킵
    if (
      t.isCallExpression(path.parent) &&
      t.isIdentifier(path.parent.callee, { name: "t" })
    ) {
      return true;
    }

    // import 구문은 스킵
    const importParent = path.findParent((p) => t.isImportDeclaration(p.node));
    if (importParent?.node && t.isImportDeclaration(importParent.node)) {
      return true;
    }

    // 객체 프로퍼티 키는 스킵 (하지만 한국어 텍스트는 제외)
    if (
      t.isObjectProperty(path.parent) &&
      path.parent.key === path.node &&
      !/[가-힣]/.test(path.node.value)
    ) {
      return true;
    }

    return false;
  }

  private processFunctionBody(path: NodePath<t.Function>): boolean {
    let wasModified = false;

    path.traverse({
      StringLiteral: (subPath) => {
        if (this.shouldSkipPath(subPath)) {
          return;
        }

        // 한국어 텍스트가 포함된 문자열만 처리
        if (/[가-힣]/.test(subPath.node.value)) {
          wasModified = true;
          const replacement = t.callExpression(t.identifier("t"), [
            t.stringLiteral(subPath.node.value),
          ]);

          if (t.isJSXAttribute(subPath.parent)) {
            subPath.replaceWith(t.jsxExpressionContainer(replacement));
          } else {
            subPath.replaceWith(replacement);
          }
        }
      },
    });

    return wasModified;
  }

  private addImportIfNeeded(ast: t.File): boolean {
    let hasImport = false;

    traverse(ast, {
      ImportDeclaration: (path) => {
        if (path.node.source.value === this.config.translationImportSource) {
          const hasUseTranslation = path.node.specifiers.some(
            (spec) =>
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              spec.imported.name === "useTranslation"
          );

          if (!hasUseTranslation) {
            path.node.specifiers.push(
              t.importSpecifier(
                t.identifier("useTranslation"),
                t.identifier("useTranslation")
              )
            );
          }
          hasImport = true;
        }
      },
    });

    if (!hasImport) {
      const importDeclaration = t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier("useTranslation"),
            t.identifier("useTranslation")
          ),
        ],
        t.stringLiteral(this.config.translationImportSource)
      );
      ast.program.body.unshift(importDeclaration);
      return true;
    }

    return false;
  }

  private isReactComponent(name: string): boolean {
    return /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
  }

  public async processFiles(): Promise<{
    processedFiles: string[];
  }> {
    const filePaths = await glob(this.config.sourcePattern);
    const processedFiles: string[] = [];

    console.log(`� Found ${filePaths.length} files to process...`);

    for (const filePath of filePaths) {
      let isFileModified = false;
      const code = fs.readFileSync(filePath, "utf-8");

      try {
        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript", "decorators-legacy"],
        });

        const modifiedComponentPaths: NodePath<t.Function>[] = [];

        traverse(ast, {
          FunctionDeclaration: (path) => {
            const componentName = path.node.id?.name;
            if (componentName && this.isReactComponent(componentName)) {
              if (this.processFunctionBody(path)) {
                isFileModified = true;
                modifiedComponentPaths.push(path);
              }
            }
          },
          ArrowFunctionExpression: (path) => {
            if (
              t.isVariableDeclarator(path.parent) &&
              t.isIdentifier(path.parent.id)
            ) {
              const componentName = path.parent.id.name;
              if (componentName && this.isReactComponent(componentName)) {
                if (this.processFunctionBody(path)) {
                  isFileModified = true;
                  modifiedComponentPaths.push(path);
                }
              }
            }
          },
        });

        if (isFileModified) {
          let wasHookAdded = false;

          // 수정된 컴포넌트에 useTranslation 훅 추가
          modifiedComponentPaths.forEach((componentPath) => {
            if (componentPath.scope.hasBinding("t")) {
              return;
            }

            const body = componentPath.get("body");
            if (body.isBlockStatement()) {
              let hasHook = false;
              body.traverse({
                CallExpression: (path) => {
                  if (
                    t.isIdentifier(path.node.callee, { name: "useTranslation" })
                  ) {
                    hasHook = true;
                  }
                },
              });

              if (!hasHook) {
                body.unshiftContainer("body", this.createUseTranslationHook());
                wasHookAdded = true;
              }
            }
          });

          // 필요한 경우 import 추가
          if (wasHookAdded) {
            this.addImportIfNeeded(ast);
          }

          if (!this.config.dryRun) {
            const output = generate(ast, {
              retainLines: true,
              compact: false,
              jsescOption: {
                minimal: true,
              },
            });

            fs.writeFileSync(filePath, output.code, "utf-8");
          }

          processedFiles.push(filePath);
          console.log(
            `🔧 ${filePath} - ${
              this.config.dryRun ? "Would be modified" : "Modified"
            }`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
      }
    }

    return {
      processedFiles,
    };
  }
}

export async function runTranslationWrapper(
  config: Partial<ScriptConfig> = {}
) {
  const wrapper = new TranslationWrapper(config);

  console.log("🚀 Starting translation wrapper...");
  const startTime = Date.now();

  const { processedFiles } = await wrapper.processFiles();

  const endTime = Date.now();
  console.log(`\n✅ Translation wrapper completed in ${endTime - startTime}ms`);
  console.log(`📊 Processed ${processedFiles.length} files`);
}

// CLI 실행 부분
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<ScriptConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pattern":
      case "-p":
        config.sourcePattern = args[++i];
        break;
      case "--dry-run":
      case "-d":
        config.dryRun = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: t-wrapper [options]

Options:
  -p, --pattern <pattern>    Source file pattern (default: "src/**/*.{js,jsx,ts,tsx}")
  -d, --dry-run             Preview changes without modifying files
  -h, --help                Show this help message

Examples:
  t-wrapper
  t-wrapper -p "app/**/*.tsx"
  t-wrapper --dry-run
        `);
        process.exit(0);
        break;
    }
  }

  runTranslationWrapper(config).catch(console.error);
}

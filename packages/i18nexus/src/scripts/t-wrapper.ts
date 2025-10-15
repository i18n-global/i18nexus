#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import * as parser from "@babel/parser";
import _traverse, { NodePath } from "@babel/traverse";
// ESM/CJS interop
const traverse =
  typeof _traverse === "function" ? _traverse : (_traverse as any).default;
import _generate from "@babel/generator";
// ESM/CJS interop
const generate =
  typeof _generate === "function" ? _generate : (_generate as any).default;
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

  private convertTemplateLiteralToTranslation(
    templateLiteral: t.TemplateLiteral
  ): {
    translationKey: string;
    variables: t.ObjectExpression;
  } | null {
    const { quasis, expressions } = templateLiteral;

    // 템플릿 문자열을 번역 키로 변환
    let translationKey = "";
    const variableMap: { [key: string]: t.Expression } = {};
    const seenVariables = new Set<string>();

    for (let i = 0; i < quasis.length; i++) {
      translationKey += quasis[i].value.raw;

      if (i < expressions.length) {
        const expr = expressions[i];

        // TSType은 건너뛰기 (Expression만 처리)
        if (t.isTSType(expr)) {
          continue;
        }

        // 변수명 추출
        let variableName: string;
        if (t.isIdentifier(expr)) {
          variableName = expr.name;
        } else {
          // 복잡한 표현식은 생성된 코드를 변수명으로 사용
          const generated = generate(expr);
          variableName = generated.code.replace(/\./g, "_");
        }

        // 중복 변수 처리
        if (!seenVariables.has(variableName)) {
          variableMap[variableName] = expr;
          seenVariables.add(variableName);
        }

        translationKey += `{{${variableName}}}`;
      }
    }

    // 변수 객체 생성
    const properties = Object.entries(variableMap).map(([key, value]) => {
      // 단순 Identifier인 경우 shorthand 사용
      if (t.isIdentifier(value) && value.name === key) {
        return t.objectProperty(t.identifier(key), value, false, true);
      }
      // 그 외의 경우 일반 프로퍼티
      return t.objectProperty(t.identifier(key), value, false, false);
    });

    return {
      translationKey,
      variables: t.objectExpression(properties),
    };
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
      TemplateLiteral: (subPath) => {
        // 이미 t() 함수로 래핑된 경우 스킵
        if (
          t.isCallExpression(subPath.parent) &&
          t.isIdentifier(subPath.parent.callee, { name: "t" })
        ) {
          return;
        }

        // import 구문은 스킵
        const importParent = subPath.findParent((p) =>
          t.isImportDeclaration(p.node)
        );
        if (importParent?.node && t.isImportDeclaration(importParent.node)) {
          return;
        }

        // 템플릿 전체 텍스트를 확인 (한국어 포함 여부)
        const fullText = subPath.node.quasis.map((q) => q.value.raw).join("");
        if (!/[가-힣]/.test(fullText)) {
          return;
        }

        // 템플릿 리터럴이 변수를 포함하는 경우에만 처리
        if (subPath.node.expressions.length > 0) {
          const converted = this.convertTemplateLiteralToTranslation(
            subPath.node
          );

          if (converted) {
            wasModified = true;
            const replacement = t.callExpression(t.identifier("t"), [
              t.stringLiteral(converted.translationKey),
              converted.variables,
            ]);

            if (t.isJSXExpressionContainer(subPath.parent)) {
              // JSX 내부의 경우
              subPath.replaceWith(replacement);
            } else if (t.isJSXAttribute(subPath.parent)) {
              // JSX 속성의 경우
              subPath.replaceWith(t.jsxExpressionContainer(replacement));
            } else {
              // 일반 JavaScript 표현식
              subPath.replaceWith(replacement);
            }
          }
        } else {
          // 변수가 없는 템플릿 리터럴은 일반 문자열처럼 처리
          const text = subPath.node.quasis[0].value.raw;
          if (/[가-힣]/.test(text)) {
            wasModified = true;
            const replacement = t.callExpression(t.identifier("t"), [
              t.stringLiteral(text),
            ]);

            if (t.isJSXAttribute(subPath.parent)) {
              subPath.replaceWith(t.jsxExpressionContainer(replacement));
            } else {
              subPath.replaceWith(replacement);
            }
          }
        }
      },
      JSXText: (subPath) => {
        const text = subPath.node.value.trim();

        // 빈 텍스트나 공백만 있는 경우 스킵
        if (!text) {
          return;
        }

        // 한국어가 포함된 텍스트만 처리
        if (/[가-힣]/.test(text)) {
          wasModified = true;

          // t() 함수 호출로 감싸기
          const replacement = t.jsxExpressionContainer(
            t.callExpression(t.identifier("t"), [t.stringLiteral(text)])
          );

          subPath.replaceWith(replacement);
        }
      },
    });

    return wasModified;
  }

  private addImportIfNeeded(ast: t.File): boolean {
    let hasImport = false;

    traverse(ast, {
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        if (path.node.source.value === this.config.translationImportSource) {
          const hasUseTranslation = path.node.specifiers.some(
            (
              spec:
                | t.ImportSpecifier
                | t.ImportDefaultSpecifier
                | t.ImportNamespaceSpecifier
            ) =>
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
          FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
            const componentName = path.node.id?.name;
            if (componentName && this.isReactComponent(componentName)) {
              if (this.processFunctionBody(path)) {
                isFileModified = true;
                modifiedComponentPaths.push(path);
              }
            }
          },
          ArrowFunctionExpression: (
            path: NodePath<t.ArrowFunctionExpression>
          ) => {
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

// ESM에서는 이 부분을 제거하고 bin 파일에서만 실행
// CLI 실행은 bin/i18n-wrapper.ts에서 처리됨

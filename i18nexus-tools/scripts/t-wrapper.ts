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
  // 상수 분석 결과 저장: 변수명 -> 렌더링 가능한 속성들
  private constantsWithRenderableProps: Map<string, Set<string>> = new Map();

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

  /**
   * 변수명이 상수 패턴인지 판단 (대문자 시작 또는 ALL_CAPS)
   * 외부 import된 상수를 감지하기 위한 휴리스틱
   */
  private looksLikeConstant(varName: string): boolean {
    // ALL_CAPS 패턴 (예: NAV_ITEMS, BUTTON_CONFIG)
    if (/^[A-Z][A-Z0-9_]*$/.test(varName)) {
      return true;
    }

    // PascalCase 패턴 (예: NavItems, ButtonConfig)
    // 하지만 React 컴포넌트와 구분하기 위해 좀 더 엄격하게
    // Items, Config 등으로 끝나는 경우만
    if (
      /^[A-Z][a-z]+(?:[A-Z][a-z]+)*(Items|Config|Data|List|Menu|Options|Settings)$/.test(
        varName
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * 렌더링될 가능성이 있는 속성명인지 판단
   */
  private isRenderablePropertyName(propName: string): boolean {
    const renderableKeywords = [
      "label",
      "title",
      "text",
      "name",
      "placeholder",
      "description",
      "content",
      "message",
      "tooltip",
      "hint",
      "caption",
      "subtitle",
      "heading",
    ];

    const lowerPropName = propName.toLowerCase();
    return renderableKeywords.some((keyword) =>
      lowerPropName.includes(keyword)
    );
  }

  /**
   * API 데이터나 동적 데이터인지 확인
   */
  private isDynamicData(path: NodePath<t.VariableDeclaration>): boolean {
    // let, var 선언은 동적 데이터로 간주
    if (path.node.kind !== "const") {
      return true;
    }

    // useState, useEffect 등 훅 내부인지 확인
    const declarations = path.node.declarations;
    for (const declarator of declarations) {
      if (declarator.init) {
        // useState, useQuery, fetch, axios 등의 패턴
        if (t.isCallExpression(declarator.init)) {
          const callee = declarator.init.callee;

          // useState, useQuery, useMutation, useEffect 등
          if (
            t.isIdentifier(callee) &&
            (callee.name.startsWith("use") ||
              callee.name === "fetch" ||
              callee.name === "axios")
          ) {
            return true;
          }

          // fetch().then(), axios.get() 등의 MemberExpression
          if (t.isMemberExpression(callee)) {
            const object = callee.object;
            if (
              t.isIdentifier(object) &&
              (object.name === "fetch" ||
                object.name === "axios" ||
                object.name === "api")
            ) {
              return true;
            }
          }
        }

        // await 표현식 (await fetch(), await axios() 등)
        if (t.isAwaitExpression(declarator.init)) {
          return true;
        }

        // 배열/객체 destructuring에서 오는 데이터
        if (
          t.isArrayPattern(declarator.id) ||
          t.isObjectPattern(declarator.id)
        ) {
          return true;
        }

        // .then(), .catch() 체이닝
        if (t.isCallExpression(declarator.init)) {
          const callee = declarator.init.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property) &&
            (callee.property.name === "then" ||
              callee.property.name === "catch" ||
              callee.property.name === "finally")
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 변수가 Props나 함수 파라미터에서 온 것인지 확인
   */
  private isFromPropsOrParams(varName: string, scope: any): boolean {
    const binding = scope.getBinding(varName);

    if (!binding) {
      return false;
    }

    const bindingPath = binding.path;

    // 함수 파라미터인 경우
    if (bindingPath.isIdentifier()) {
      const parent = bindingPath.parentPath;

      // 함수 선언의 파라미터
      if (
        parent &&
        (parent.isFunctionDeclaration() ||
          parent.isFunctionExpression() ||
          parent.isArrowFunctionExpression())
      ) {
        // map, filter, forEach 등의 콜백 파라미터는 제외
        // 예: NAV_ITEMS.map((item) => ...) 에서 item은 배열 요소이므로 처리해야 함
        const grandParent = parent.parentPath;
        if (grandParent && t.isCallExpression(grandParent.node)) {
          const callee = grandParent.node.callee;
          if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            const methodName = callee.property.name;
            const arrayMethods = [
              "map",
              "filter",
              "forEach",
              "find",
              "some",
              "every",
              "reduce",
            ];
            if (arrayMethods.includes(methodName)) {
              // 배열 메서드의 콜백 파라미터는 props/params가 아님
              return false;
            }
          }
        }

        // React 컴포넌트의 props 파라미터인지 확인
        const funcParent = parent.node;
        if (funcParent && "params" in funcParent) {
          const params = funcParent.params;
          // 첫 번째 파라미터는 보통 props
          if (params.length > 0 && params[0] === bindingPath.node) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 상수 선언을 분석하여 렌더링 가능한 속성을 찾음
   * 1 depth만 탐색, API 데이터는 제외
   */
  private analyzeConstantDeclaration(
    path: NodePath<t.VariableDeclaration>
  ): void {
    // const 선언만 분석
    if (path.node.kind !== "const") {
      return;
    }

    // API 데이터나 동적 데이터는 제외
    if (this.isDynamicData(path)) {
      return;
    }

    path.node.declarations.forEach((declarator) => {
      if (!t.isIdentifier(declarator.id)) {
        return;
      }

      const varName = declarator.id.name;
      const renderableProps = new Set<string>();

      // 배열인 경우
      if (t.isArrayExpression(declarator.init)) {
        declarator.init.elements.forEach((element) => {
          if (element && t.isObjectExpression(element)) {
            // 1 depth: 배열 내 객체의 속성들 확인
            element.properties.forEach((prop) => {
              if (t.isObjectProperty(prop)) {
                let propName: string | null = null;

                if (t.isIdentifier(prop.key)) {
                  propName = prop.key.name;
                } else if (t.isStringLiteral(prop.key)) {
                  propName = prop.key.value;
                }

                // 속성 값이 한국어 문자열이고 렌더링 가능한 속성인 경우
                if (
                  propName &&
                  t.isStringLiteral(prop.value) &&
                  /[가-힣]/.test(prop.value.value) &&
                  this.isRenderablePropertyName(propName)
                ) {
                  renderableProps.add(propName);
                }
              }
            });
          }
        });
      }
      // 객체인 경우
      else if (t.isObjectExpression(declarator.init)) {
        declarator.init.properties.forEach((prop) => {
          if (t.isObjectProperty(prop)) {
            let propName: string | null = null;

            if (t.isIdentifier(prop.key)) {
              propName = prop.key.name;
            } else if (t.isStringLiteral(prop.key)) {
              propName = prop.key.value;
            }

            // 속성 값이 한국어 문자열이고 렌더링 가능한 속성인 경우
            if (
              propName &&
              t.isStringLiteral(prop.value) &&
              /[가-힣]/.test(prop.value.value) &&
              this.isRenderablePropertyName(propName)
            ) {
              renderableProps.add(propName);
            }
          }
        });
      }

      // 렌더링 가능한 속성이 있으면 저장
      if (renderableProps.size > 0) {
        this.constantsWithRenderableProps.set(varName, renderableProps);
      }
    });
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
      // JSX 표현식에서 상수 속성 접근 감지
      // 예: {item.label} -> {t(item.label)}
      JSXExpressionContainer: (subPath) => {
        const expression = subPath.node.expression;

        // 이미 t()로 래핑된 경우 스킵
        if (
          t.isCallExpression(expression) &&
          t.isIdentifier(expression.callee, { name: "t" })
        ) {
          return;
        }

        // MemberExpression 확인: item.label 형태
        if (
          t.isMemberExpression(expression) &&
          t.isIdentifier(expression.property)
        ) {
          const propertyName = expression.property.name;

          // 렌더링 가능한 속성인지 먼저 확인
          if (!this.isRenderablePropertyName(propertyName)) {
            return;
          }

          // 객체 부분이 Identifier인지 확인
          if (!t.isIdentifier(expression.object)) {
            return;
          }

          let shouldWrap = false;
          const objectName = expression.object.name;

          // Props나 함수 파라미터에서 온 데이터인지 확인 (제외해야 함)
          if (this.isFromPropsOrParams(objectName, subPath.scope)) {
            console.log(
              `     🚫 Skipping ${objectName}.${propertyName} - from props/params`
            );
            return;
          }

          // 케이스 1: 직접 상수 접근 - BUTTON_CONFIG.title
          const constantProps =
            this.constantsWithRenderableProps.get(objectName);

          if (constantProps && constantProps.has(propertyName)) {
            // 직접 상수 접근
            shouldWrap = true;
            console.log(
              `     ✅ Direct constant access: ${objectName}.${propertyName}`
            );
          }
          // 외부 파일의 상수일 가능성 확인 (휴리스틱)
          else if (
            this.looksLikeConstant(objectName) &&
            this.isRenderablePropertyName(propertyName)
          ) {
            shouldWrap = true;
            console.log(
              `     ✅ External constant (heuristic): ${objectName}.${propertyName}`
            );
          } else {
            // 케이스 2: 배열 요소 접근 - item.label, field.placeholder
            // item이나 field가 어디서 왔는지 추적
            const binding = subPath.scope.getBinding(objectName);

            if (binding) {
              console.log(`     🔍 Analyzing binding for ${objectName}`);
              // map/forEach의 콜백 파라미터인 경우
              const bindingPath = binding.path;

              // 화살표 함수나 일반 함수의 파라미터인지 확인
              if (bindingPath.isIdentifier()) {
                const parent = bindingPath.parentPath;

                // 함수 파라미터인 경우
                if (
                  parent &&
                  (parent.isArrowFunctionExpression() ||
                    parent.isFunctionExpression())
                ) {
                  // 이 함수가 .map()이나 .forEach() 호출인지 확인
                  const funcParent = parent.parentPath;

                  if (funcParent && t.isCallExpression(funcParent.node)) {
                    const callee = funcParent.node.callee;

                    // NAV_ITEMS.map() 형태인지 확인
                    if (
                      t.isMemberExpression(callee) &&
                      t.isIdentifier(callee.object) &&
                      t.isIdentifier(callee.property) &&
                      (callee.property.name === "map" ||
                        callee.property.name === "forEach" ||
                        callee.property.name === "filter" ||
                        callee.property.name === "find")
                    ) {
                      const sourceArray = callee.object.name;
                      console.log(
                        `     🔍 Found array method: ${sourceArray}.${callee.property.name}()`
                      );

                      // 소스 배열이 props나 파라미터에서 온 것인지 확인
                      if (
                        this.isFromPropsOrParams(sourceArray, subPath.scope)
                      ) {
                        console.log(
                          `     🚫 Skipping ${sourceArray} - from props/params`
                        );
                        return;
                      }

                      const sourceArrayProps =
                        this.constantsWithRenderableProps.get(sourceArray);

                      console.log(
                        `     📋 Source array ${sourceArray} has props:`,
                        sourceArrayProps ? Array.from(sourceArrayProps) : "none"
                      );

                      // 소스 배열이 분석된 상수이고, 해당 속성이 한국어를 포함한 경우
                      if (
                        sourceArrayProps &&
                        sourceArrayProps.has(propertyName)
                      ) {
                        shouldWrap = true;
                        console.log(
                          `     ✅ Array element access: ${sourceArray}[].${propertyName}`
                        );
                      }
                      // 외부 파일의 상수일 가능성 (휴리스틱)
                      else if (
                        this.looksLikeConstant(sourceArray) &&
                        this.isRenderablePropertyName(propertyName)
                      ) {
                        shouldWrap = true;
                        console.log(
                          `     ✅ External array element (heuristic): ${sourceArray}[].${propertyName}`
                        );
                      } else {
                        console.log(
                          `     ❌ Property ${propertyName} not found in ${sourceArray} or not Korean`
                        );
                      }
                    }
                  }
                }
              }
            } else {
              console.log(`     ❌ No binding found for ${objectName}`);
            }
          }

          if (shouldWrap) {
            wasModified = true;

            // t(item.label) 형태로 래핑
            const wrappedExpression = t.callExpression(t.identifier("t"), [
              expression as t.Expression,
            ]);

            subPath.node.expression = wrappedExpression;
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

        // Step 1: 먼저 상수 선언들을 분석
        this.constantsWithRenderableProps.clear();
        traverse(ast, {
          VariableDeclaration: (path) => {
            this.analyzeConstantDeclaration(path);
          },
        });

        // 분석 결과 로깅
        if (this.constantsWithRenderableProps.size > 0) {
          console.log(
            `   📋 Found constants with renderable properties in ${filePath}:`
          );
          this.constantsWithRenderableProps.forEach((props, varName) => {
            console.log(
              `      - ${varName}: [${Array.from(props).join(", ")}]`
            );
          });
        }

        const modifiedComponentPaths: NodePath<t.Function>[] = [];

        // Step 2: 컴포넌트 내부 처리
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

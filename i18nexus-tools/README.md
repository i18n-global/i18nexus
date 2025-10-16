# i18nexus-tools

한국어 React 애플리케이션을 위한 간단하고 강력한 국제화 CLI 도구

## 설치

```bash
# 전역 설치 (권장)
npm install -g i18nexus-tools

# 또는 프로젝트에 설치
npm install -D i18nexus-tools
```

## 🚀 빠른 시작

### 1. 프로젝트 초기화

```bash
# i18nexus 프로젝트 초기화
npx i18n-sheets init

# Google Sheets 연동 초기화 (선택사항)
npx i18n-sheets init -s <spreadsheet-id> -c ./credentials.json
```

> **참고**: `npx`를 사용하면 전역 설치 없이 바로 실행할 수 있습니다. 전역 설치한 경우 `npx` 없이 `i18n-sheets init`으로 실행할 수 있습니다.

초기화 시 다음 파일들이 생성됩니다:

- `i18nexus.config.json` - 프로젝트 설정 파일
- `locales/en.json` - 영어 번역 파일
- `locales/ko.json` - 한국어 번역 파일

### 2. 설정 파일 (`i18nexus.config.json`)

```json
{
  "languages": ["en", "ko"],
  "defaultLanguage": "ko",
  "localesDir": "./locales",
  "sourcePattern": "src/**/*.{js,jsx,ts,tsx}",
  "googleSheets": {
    "spreadsheetId": "",
    "credentialsPath": "./credentials.json",
    "sheetName": "Translations"
  }
}
```

## 핵심 도구

### 1. i18n-wrapper - 자동 번역 래핑

한국어 하드코딩 문자열을 자동으로 `t()` 함수로 래핑하고 `useTranslation` 훅을 추가합니다.

```bash
# 기본 사용법 - src/** 에서 한국어 텍스트 처리
npx i18n-wrapper

# 커스텀 패턴과 네임스페이스
npx i18n-wrapper -p "app/**/*.tsx" -n "components"

# 변경사항 미리보기
npx i18n-wrapper --dry-run
```

**특징:**

- 한국어/영어 문자열 자동 감지
- `useTranslation()` 훅 자동 추가 (i18nexus-core)
- 번역 키 파일 자동 생성 (띄어쓰기 포함)
- 기존 t() 호출 및 import 보존

### 2. i18n-extractor - 번역 키 추출

`t()` 함수 호출에서 번역 키를 추출하여 en.json과 ko.json 파일을 생성/업데이트합니다.

```bash
# 기본 사용법 - locales/en.json, locales/ko.json에 추출
npx i18n-extractor

# 커스텀 패턴과 출력 디렉토리
npx i18n-extractor -p "app/**/*.tsx" -d "./public/locales"

# CSV 형식으로 추출 (Google Sheets 용)
npx i18n-extractor -f csv -o "translations.csv"

# 추출 결과 미리보기
npx i18n-extractor --dry-run
```

**특징:**

- t() 함수 호출에서 번역 키 자동 추출
- **en.json과 ko.json 파일에 자동 병합** (기존 번역 유지)
- JSON: i18n-core 호환 형식 출력
- CSV: 구글 시트 호환 형식 출력 (Key, English, Korean)
- 중복 키 감지 및 보고

### 3. i18n-upload / i18n-download - Google Sheets 업로드/다운로드

로컬 번역 파일(`en.json`, `ko.json`)과 Google Sheets를 동기화합니다.

```bash
# Google Sheets에 번역 업로드
npx i18n-upload

# Google Sheets에서 번역 다운로드 (증분 업데이트 - 새로운 키만 추가)
npx i18n-download

# Google Sheets에서 번역 다운로드 (강제 덮어쓰기)
npx i18n-download-force

# 옵션으로 실행
npx i18n-upload -s <spreadsheet-id> -c ./credentials.json
npx i18n-download -s <spreadsheet-id> -c ./credentials.json
```

**특징:**

- `i18nexus.config.json`에서 설정 자동 로드
- `locales/en.json`, `locales/ko.json` 형식으로 저장
- `i18n-download`: 기존 번역 유지, 새로운 키만 추가 (안전)
- `i18n-download-force`: 모든 번역 덮어쓰기 (최신 상태로 동기화)
- `i18n-upload`: 로컬의 새로운 키만 Google Sheets에 추가

### 4. i18n-sheets - Google Sheets 연동 (레거시)

Google Sheets를 통해 번역 관리를 쉽게 할 수 있습니다.

```bash
# 로컬 번역 파일을 Google Sheets에 업로드
npx i18n-sheets upload -s <spreadsheet-id>

# Google Sheets에서 번역 다운로드
npx i18n-sheets download -s <spreadsheet-id>

# 양방향 동기화
npx i18n-sheets sync -s <spreadsheet-id>

# 상태 확인
npx i18n-sheets status -s <spreadsheet-id>
```

## 📱 Next.js App Directory 사용자 가이드

Next.js App Router (13+)를 사용하는 경우, 다음 설정을 따르세요:

### 1. 프로젝트 구조

```
your-app/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈 페이지
│   └── components/         # 클라이언트 컴포넌트
├── locales/
│   ├── en.json            # 영어 번역
│   └── ko.json            # 한국어 번역
├── i18nexus.config.json   # i18nexus 설정
└── package.json
```

### 2. 설정 파일 수정

`i18nexus.config.json`에서 App Directory에 맞게 패턴 설정:

```json
{
  "languages": ["en", "ko"],
  "defaultLanguage": "ko",
  "localesDir": "./locales",
  "sourcePattern": "app/**/*.{js,jsx,ts,tsx}",
  "googleSheets": {
    "spreadsheetId": "",
    "credentialsPath": "./credentials.json",
    "sheetName": "Translations"
  }
}
```

**참고:** `sourcePattern`을 `"app/**/*.{js,jsx,ts,tsx}"`로 설정하면 App Directory의 모든 파일을 스캔합니다.

### 3. 루트 레이아웃 설정

```tsx
// app/layout.tsx
import { I18nProvider } from "i18nexus";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const language = cookieStore.get("i18n-language")?.value || "ko";

  return (
    <html lang={language}>
      <body>
        <I18nProvider
          initialLanguage={language}
          languageManagerOptions={{
            defaultLanguage: "ko",
            availableLanguages: [
              { code: "ko", name: "한국어", flag: "🇰🇷" },
              { code: "en", name: "English", flag: "🇺🇸" },
            ],
          }}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 4. 클라이언트 컴포넌트에서 사용

```tsx
// app/components/Welcome.tsx
"use client";

import { useTranslation, useLanguageSwitcher } from "i18nexus";

export default function Welcome() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguageSwitcher();

  return (
    <div>
      <h1>{t("환영합니다")}</h1>
      <button onClick={() => changeLanguage("en")}>English</button>
      <button onClick={() => changeLanguage("ko")}>한국어</button>
    </div>
  );
}
```

### 5. App Directory 워크플로우

```bash
# 1. 프로젝트 초기화
npx i18n-sheets init

# 2. app 디렉토리의 하드코딩된 텍스트를 t() 함수로 래핑
npx i18n-wrapper -p "app/**/*.{ts,tsx}"

# 3. 번역 키를 en.json과 ko.json에 추출
npx i18n-extractor -p "app/**/*.{ts,tsx}" -d "./locales"

# 4. 번역 작업 (선택사항 - Google Sheets 사용)
npx i18n-sheets upload -s <spreadsheet-id>

# 5. 번역 완료 후 다운로드
npx i18n-sheets download -s <spreadsheet-id>
```

### 6. 주요 차이점 (Pages vs App Directory)

| 기능      | Pages Directory                              | App Directory                            |
| --------- | -------------------------------------------- | ---------------------------------------- |
| 파일 패턴 | `src/**/*.{ts,tsx}` or `pages/**/*.{ts,tsx}` | `app/**/*.{ts,tsx}`                      |
| 컴포넌트  | 자동으로 클라이언트 컴포넌트                 | `"use client"` 명시 필요                 |
| 쿠키 읽기 | `document.cookie`                            | `cookies()` from `next/headers`          |
| SSR 설정  | `getServerSideProps`                         | 루트 레이아웃에서 `initialLanguage` 전달 |

### 7. 중요 팁

1. **"use client" 지시어**: `useTranslation`과 `useLanguageSwitcher`를 사용하는 모든 컴포넌트에는 `"use client"`를 추가해야 합니다.

2. **하이드레이션 오류 방지**: 서버와 클라이언트가 같은 언어로 렌더링되도록 루트 레이아웃에서 쿠키 기반 `initialLanguage`를 설정하세요.

3. **번역 파일 위치**: App Router에서는 `public/locales` 대신 프로젝트 루트의 `locales` 디렉토리를 권장합니다.

## 사용 예시

### 1단계: 하드코딩된 텍스트를 t() 함수로 래핑

```tsx
// Before
export default function Welcome() {
  return <h1>안녕하세요 반갑습니다</h1>;
}

// After (i18n-wrapper 실행 후)
import { useTranslation } from "i18nexus-core";

export default function Welcome() {
  const { t } = useTranslation("common");
  return <h1>{t("안녕하세요 반갑습니다")}</h1>;
}
```

### 2단계: 번역 키 추출

```bash
npx i18n-extractor -p "src/**/*.tsx" -d "./locales"
```

생성된 파일:

```json
// locales/ko.json
{
  "안녕하세요 반갑습니다": "안녕하세요 반갑습니다"
}

// locales/en.json
{
  "안녕하세요 반갑습니다": ""
}
```

### 3단계: 영어 번역 추가

```json
// locales/en.json
{
  "안녕하세요 반갑습니다": "Welcome! Nice to meet you"
}
```

## CLI 옵션

### i18n-wrapper 옵션

| 옵션               | 설명                    | 기본값                       |
| ------------------ | ----------------------- | ---------------------------- |
| `-p, --pattern`    | 소스 파일 패턴          | `"src/**/*.{js,jsx,ts,tsx}"` |
| `-n, --namespace`  | 번역 네임스페이스       | `"common"`                   |
| `-o, --output-dir` | 번역 파일 출력 디렉토리 | `"./locales"`                |
| `-d, --dry-run`    | 실제 수정 없이 미리보기 | -                            |
| `-h, --help`       | 도움말 표시             | -                            |

### i18n-extractor 옵션

| 옵션               | 설명                         | 기본값                          |
| ------------------ | ---------------------------- | ------------------------------- |
| `-p, --pattern`    | 소스 파일 패턴               | `"src/**/*.{js,jsx,ts,tsx}"`    |
| `-o, --output`     | 출력 파일명                  | `"extracted-translations.json"` |
| `-d, --output-dir` | 출력 디렉토리                | `"./locales"`                   |
| `-f, --format`     | 출력 형식 (json/csv)         | `"json"`                        |
| `--dry-run`        | 실제 파일 생성 없이 미리보기 | -                               |
| `-h, --help`       | 도움말 표시                  | -                               |

### i18n-sheets 옵션

| 옵션                | 설명                              | 기본값                 |
| ------------------- | --------------------------------- | ---------------------- |
| `-s, --spreadsheet` | Google Spreadsheet ID             | -                      |
| `-c, --credentials` | Google 서비스 계정 인증 파일 경로 | `"./credentials.json"` |
| `-w, --worksheet`   | 워크시트 이름                     | `"Translations"`       |
| `-l, --locales`     | 로컬 번역 파일 디렉토리           | `"./locales"`          |
| `--languages`       | 언어 목록 (쉼표로 구분)           | `"en,ko"`              |

## 워크플로우

### 기본 워크플로우

1. **초기화**: `npx i18n-sheets init`으로 프로젝트 설정
2. **개발**: 한국어로 하드코딩하여 개발
3. **변환**: `npx i18n-wrapper`로 t() 함수 래핑
4. **추출**: `npx i18n-extractor`로 번역 키를 en.json, ko.json에 추출
5. **번역**: 영어 번역 추가
6. **배포**: 다국어 지원 완료

### Google Sheets 워크플로우

1. **초기화**: `npx i18n-sheets init -s <spreadsheet-id>`
2. **개발 & 변환**: 위와 동일
3. **업로드**: `npx i18n-sheets upload`로 Google Sheets에 업로드
4. **번역**: 번역가가 Google Sheets에서 작업
5. **다운로드**: `npx i18n-sheets download`로 번역 다운로드
6. **배포**: 다국어 지원 완료

## Google Sheets 설정

### 1. Google Service Account 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. Google Sheets API 활성화
4. Service Account 생성
5. JSON 키 파일 다운로드
6. `credentials.json`으로 저장

### 2. Google Spreadsheet 설정

1. 새 Google Spreadsheet 생성
2. Service Account 이메일과 공유
3. URL에서 Spreadsheet ID 복사
4. `npx i18n-sheets init -s <spreadsheet-id>`로 초기화

## 관련 패키지

- `i18nexus-core` - React 컴포넌트와 훅
- `i18nexus` - 전체 toolkit (Google Sheets 연동 포함)

## 라이센스

MIT

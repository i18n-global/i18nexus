# Server-Side i18n 사용 가이드

## 자동 설정 로드 방식 (권장)

`i18nexus.config.json` 파일이 있으면 자동으로 설정을 읽어서 작동합니다.

### 1. 프로젝트 초기화

```bash
npx i18n-sheets init --languages en,ko
```

이 명령어는 다음 파일들을 생성합니다:

- `i18nexus.config.json` (설정 파일)
- `locales/en.json` (영어 번역 파일)
- `locales/ko.json` (한국어 번역 파일)
- `locales/index.ts` (자동 생성된 export 파일)

### 2. 서버 컴포넌트에서 사용

이제 아무런 props 없이도 `createServerI18n()`만 호출하면 됩니다!

```tsx
// app/page.tsx (Server Component)
import { createServerI18n } from "i18nexus/server";
import { headers } from "next/headers";

export default async function ServerPage() {
  const headersList = await headers();

  // config에서 자동으로 localesDir, defaultLanguage 등을 읽어옵니다
  const { t, language } = await createServerI18n(headersList);

  return (
    <div>
      <h1>{t("환영합니다")}</h1>
      <p>{t("서버사이드 번역 테스트")}</p>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### 3. 설정 파일 예시

```json
// i18nexus.config.json
{
  "languages": ["en", "ko"],
  "defaultLanguage": "ko",
  "localesDir": "./locales",
  "sourcePattern": "app/**/*.{js,jsx,ts,tsx}",
  "googleSheets": {
    "spreadsheetId": "your-spreadsheet-id",
    "credentialsPath": "./credentials.json",
    "sheetName": "Translations"
  }
}
```

## 커스텀 설정 사용

config 파일이 있어도 옵션으로 override 할 수 있습니다:

```tsx
import { createServerI18n } from "i18nexus/server";
import { headers } from "next/headers";

export default async function ServerPage() {
  const headersList = await headers();

  // config 설정을 override
  const { t, language } = await createServerI18n(headersList, {
    localesDir: "./custom/locales",
    defaultLanguage: "en",
  });

  return <h1>{t("Hello")}</h1>;
}
```

## 기존 방식 (명시적 translations 전달)

기존 방식도 여전히 지원됩니다:

```tsx
import { createServerI18nWithTranslations } from "i18nexus/server";
import { headers } from "next/headers";
import { translations } from "@/locales";

export default async function ServerPage() {
  const headersList = await headers();
  const { t, language } = createServerI18nWithTranslations(
    headersList,
    translations
  );

  return <h1>{t("Welcome")}</h1>;
}
```

## Layout에서 사용 (SSR)

```tsx
// app/layout.tsx
import { createServerI18n } from "i18nexus/server";
import { headers } from "next/headers";
import { I18nProvider } from "i18nexus";

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const { language, translations } = await createServerI18n(headersList);

  return (
    <html lang={language}>
      <body>
        <I18nProvider initialLanguage={language} translations={translations}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

## 워크플로우

### 1. 초기 설정

```bash
# 프로젝트 초기화
npx i18n-sheets init --languages en,ko,ja

# 또는 Google Sheets와 함께
npx i18n-sheets init -s your-spreadsheet-id --languages en,ko,ja
```

### 2. 번역 키 추출

```bash
# 코드에서 t() 함수 호출을 찾아서 JSON 파일로 추출
npx i18n-extractor

# 생성된 파일:
# - locales/en.json
# - locales/ko.json
# - locales/ja.json
# - locales/index.ts (자동 생성)
```

### 3. Google Sheets 동기화 (선택사항)

```bash
# 로컬 파일을 Google Sheets로 업로드
npx i18n-sheets upload

# Google Sheets에서 다운로드
npx i18n-sheets download
```

### 4. 서버 컴포넌트에서 사용

```tsx
import { createServerI18n } from "i18nexus/server";
import { headers } from "next/headers";

export default async function Page() {
  const { t } = await createServerI18n(await headers());
  return <h1>{t("title")}</h1>;
}
```

## 장점

✅ **간편함**: `createServerI18n(headers)`만 호출하면 끝  
✅ **자동 설정**: config 파일에서 모든 설정을 읽어옴  
✅ **타입 안전**: 완전한 TypeScript 지원  
✅ **유연함**: 필요시 옵션으로 override 가능  
✅ **SSR 지원**: Hydration mismatch 없음  
✅ **Google Sheets 통합**: 번역가와 협업 가능

# i18nexus 사용 예제 (TypeScript 자동 타입 추론)

## 설정 파일 (한 번만 작성)

```typescript
// 📁 lib/i18n.ts
import { createI18n } from 'i18nexus';

// 번역 객체 정의 (클라이언트/서버 공유)
export const translations = {
  en: {
    greeting: "Hello",
    farewell: "Goodbye",
    welcome: "Welcome {{name}}!",
    itemCount: "You have {{count}} items"
  },
  ko: {
    greeting: "안녕하세요",
    farewell: "안녕히 가세요",
    welcome: "{{name}}님 환영합니다!",
    itemCount: "{{count}}개의 아이템이 있습니다"
  }
} as const;

// 클라이언트용 i18n 인스턴스 (자동 타입 추론!)
export const i18n = createI18n(translations);

// 타입 추출 (필요한 경우)
export type AppTranslationKeys = keyof typeof translations.en;
export type AppLanguages = keyof typeof translations;
```

---

## 클라이언트 사이드 사용

### 1. Provider 설정

```typescript
// 📁 app/layout.tsx
import { i18n } from '@/lib/i18n';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <i18n.Provider
          languageManagerOptions={{
            languages: [
              { code: "en", name: "English" },
              { code: "ko", name: "한국어" }
            ],
            defaultLanguage: "ko"
          }}
        >
          {children}
        </i18n.Provider>
      </body>
    </html>
  );
}
```

### 2. 컴포넌트에서 사용 (자동 타입 추론!)

```typescript
// 📁 components/Greeting.tsx
'use client';

import { i18n } from '@/lib/i18n';

export function Greeting() {
  const { t, currentLanguage } = i18n.useTranslation();

  return (
    <div>
      {/* ✅ 자동완성 지원! */}
      <h1>{t("greeting")}</h1>

      {/* ✅ 변수 삽입 */}
      <p>{t("welcome", { name: "홍길동" })}</p>

      {/* ❌ TypeScript 에러 - 존재하지 않는 키 */}
      {/* <p>{t("invalid_key")}</p> */}

      <p>Current language: {currentLanguage}</p>
    </div>
  );
}
```

### 3. 언어 전환

```typescript
// 📁 components/LanguageSwitcher.tsx
'use client';

import { useLanguageSwitcher } from 'i18nexus';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguageSwitcher();

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 서버 사이드 사용 (Next.js App Router)

### 방법 1: 간단한 방식 (추천)

```typescript
// 📁 app/page.tsx (Server Component)
import { createServerI18n } from 'i18nexus/server';

export default async function ServerPage() {
  // ✅ 설정 자동 로드, Accept-Language 헤더 자동 감지
  const { t, language } = await createServerI18n({
    translations: translations,
    availableLanguages: ["en", "ko"],
    defaultLanguage: "ko"
  });

  return (
    <div>
      <h1>{t("greeting")}</h1>
      <p>{t("welcome", { name: "Server User" })}</p>
      <p>Detected language: {language}</p>
    </div>
  );
}
```

### 방법 2: 헤더 직접 전달

```typescript
// 📁 app/server-page/page.tsx
import { headers } from 'next/headers';
import { createServerI18nWithTranslations } from 'i18nexus/server';
import { translations } from '@/lib/i18n';

export default async function ServerPage() {
  const headersList = await headers();

  const { t, language, dict } = createServerI18nWithTranslations(
    headersList,
    translations,
    {
      availableLanguages: ["en", "ko"],
      defaultLanguage: "ko"
    }
  );

  return (
    <div>
      {/* t() 함수 사용 */}
      <h1>{t("greeting")}</h1>

      {/* dict 객체 사용 (타입 안전하지 않음) */}
      <p>{dict["farewell"]}</p>

      <p>Language: {language}</p>
    </div>
  );
}
```

### 방법 3: SSR Hydration (클라이언트와 동기화)

```typescript
// 📁 app/layout.tsx
import { headers } from 'next/headers';
import { getServerLanguage } from 'i18nexus/server';
import { i18n } from '@/lib/i18n';

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const language = getServerLanguage(headersList, {
    availableLanguages: ["en", "ko"],
    defaultLanguage: "ko"
  });

  return (
    <html lang={language}>
      <body>
        {/* initialLanguage로 서버-클라이언트 동기화 */}
        <i18n.Provider initialLanguage={language}>
          {children}
        </i18n.Provider>
      </body>
    </html>
  );
}
```

---

## 주요 차이점 정리

| 기능 | 클라이언트 | 서버 |
|------|-----------|------|
| **Provider 필요** | ✅ `<i18n.Provider>` | ❌ 불필요 |
| **Hook 사용** | ✅ `i18n.useTranslation()` | ❌ 불가 (React Hook 규칙) |
| **번역 함수** | `const { t } = i18n.useTranslation()` | `const { t } = await createServerI18n()` |
| **언어 전환** | ✅ `changeLanguage()` | ❌ 불가 (서버는 stateless) |
| **타입 추론** | ✅ 자동 | ✅ 자동 (같은 객체 사용) |
| **Accept-Language** | ❌ (쿠키만 사용) | ✅ 자동 감지 |

---

## 타입 안전성 예제

```typescript
// ❌ 컴파일 에러 - 존재하지 않는 키
const text1 = t("non_existent_key");

// ✅ 정상 - 존재하는 키
const text2 = t("greeting");

// ✅ 정상 - 변수 삽입
const text3 = t("welcome", { name: "John" });

// ❌ 컴파일 에러 - 잘못된 변수명
const text4 = t("welcome", { wrongVar: "John" });
```

---

## 마이그레이션 가이드

### 기존 코드 (타입 안전하지 않음)
```typescript
<I18nProvider translations={translations}>
  const { t } = useTranslation();
  t("greeting");  // ❌ 타입 체크 안됨
</I18nProvider>
```

### 새 코드 (타입 안전!)
```typescript
const i18n = createI18n(translations);

<i18n.Provider>
  const { t } = i18n.useTranslation();
  t("greeting");  // ✅ 타입 체크됨!
</i18n.Provider>
```

---

## API 변경 사항

### 서버 API
- ✅ `getServerTranslations` → `getTranslations` (이름 간소화)
- ⚠️  `getServerTranslations`는 deprecated (하위 호환성 유지)

### 클라이언트 API
- ✅ `createI18n()` 추가 - **자동 타입 추론 지원!**
- ✅ 기존 `I18nProvider` / `useTranslation`도 그대로 사용 가능

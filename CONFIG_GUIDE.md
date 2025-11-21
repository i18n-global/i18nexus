# i18nexus Configuration Guide

## 🎯 중앙 설정 관리

`i18nexus.config.json`에 모든 설정을 정의하여 클라이언트/서버에서 공유합니다.

---

## 빠른 시작

### 1. 설정 파일 생성

```json
// i18nexus.config.json
{
  "defaultLanguage": "en",
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "ko", "name": "한국어" }
  ],
  "localesDir": "./locales",
  "namespaces": {
    "enabled": true,
    "defaultNamespace": "common",
    "fallbackChain": {
      "pages": ["common"],
      "errors": ["common"]
    }
  },
  "fallback": {
    "languages": {
      "ko": ["en"]
    }
  }
}
```

### 2. Config 기반 i18n 생성

```typescript
// lib/i18n.ts
import { createI18nFromConfigFile } from 'i18nexus';
import { translations } from './translations';

// 자동으로 i18nexus.config.json 로드
export const i18n = await createI18nFromConfigFile(translations);

// 또는 커스텀 경로
export const i18n = await createI18nFromConfigFile(translations, {
  configPath: './custom.config.json'
});
```

### 3. 사용

```typescript
// app/layout.tsx
import { i18n } from '@/lib/i18n';

export default function RootLayout({ children }) {
  return (
    <i18n.Provider>
      {children}
    </i18n.Provider>
  );
}
```

---

## 📋 전체 설정 옵션

### 기본 설정

```typescript
interface I18nexusConfig {
  // 기본 언어
  defaultLanguage?: string;  // default: "en"

  // 지원 언어 목록 (필수)
  languages: LanguageConfig[];

  // 번역 파일 디렉토리
  localesDir?: string;  // default: "./locales"

  // 쿠키 이름
  cookieName?: string;  // default: "i18n-language"

  // 쿠키 옵션
  cookieOptions?: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };
}
```

### 네임스페이스 설정

```json
{
  "namespaces": {
    "enabled": true,
    "defaultNamespace": "common",
    "fallbackChain": {
      "pages": ["common"],
      "modals": ["common"],
      "errors": ["common"]
    }
  }
}
```

**효과:**
- `t("pages.greeting")` → `common.greeting`으로 fallback
- 중복 번역 제거
- 구조화된 번역 관리

### Fallback 설정

```json
{
  "fallback": {
    "languages": {
      "ko": ["en"],
      "ja": ["en"],
      "ar": ["en"]
    },
    "showWarnings": true
  }
}
```

**효과:**
- `ko` 번역 없으면 → `en`에서 찾기
- 개발 시 경고 표시

### Dynamic Translation 설정

```json
{
  "dynamic": {
    "prefix": "api",
    "suffix": null,
    "fallback": "Translation missing",
    "showWarnings": true
  }
}
```

**효과:**
- `useDynamicTranslation()`의 기본값 설정
- 모든 dynamic 번역에 일관된 설정 적용

### 검증 설정

```json
{
  "validation": {
    "enabled": true,
    "minCoverage": 100,
    "strict": false
  }
}
```

**효과:**
- CI/CD에서 자동 검증
- 번역 누락 방지
- 최소 커버리지 강제

### 서버 사이드 설정

```json
{
  "server": {
    "detectBrowserLanguage": true,
    "preloadTranslations": true
  }
}
```

### 클라이언트 사이드 설정

```json
{
  "client": {
    "cacheTranslations": false,
    "cacheExpiration": 86400000
  }
}
```

### 개발 도구 설정

```json
{
  "devtools": {
    "enabled": true,
    "position": "bottom-right"
  }
}
```

---

## 🚀 사용 패턴

### 패턴 1: React Component에서 Config 로드

```typescript
import { I18nConfigProvider } from 'i18nexus';
import { translations } from './translations';

function App() {
  return (
    <I18nConfigProvider
      translations={translations}
      loading={() => <div>Loading...</div>}
      error={({ error }) => <div>Error: {error.message}</div>}
    >
      <YourApp />
    </I18nConfigProvider>
  );
}
```

### 패턴 2: Hook으로 동적 로드

```typescript
import { useI18nFromConfig } from 'i18nexus';

function App() {
  const { i18n, loading, error } = useI18nFromConfig(translations);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <i18n.Provider>
      <YourApp />
    </i18n.Provider>
  );
}
```

### 패턴 3: 명시적 Config

```typescript
import { createI18nFromConfig } from 'i18nexus';

const config: I18nexusConfig = {
  defaultLanguage: "ko",
  languages: [
    { code: "en", name: "English" },
    { code: "ko", name: "한국어" }
  ],
  namespaces: {
    enabled: true,
    fallbackChain: {
      "pages": ["common"]
    }
  }
};

const i18n = createI18nFromConfig(config, translations);
```

### 패턴 4: 환경 변수에서 로드

```bash
# .env
I18NEXUS_CONFIG='{"defaultLanguage":"ko","languages":[...]}'
```

```typescript
import { loadConfigFromEnv, createI18nFromConfig } from 'i18nexus';

const config = loadConfigFromEnv();
if (config) {
  const i18n = createI18nFromConfig(config, translations);
}
```

---

## 📁 프로젝트 구조 예제

```
my-app/
├── i18nexus.config.json       # 중앙 설정
├── locales/
│   ├── en/
│   │   ├── common.json
│   │   ├── pages.json
│   │   └── errors.json
│   └── ko/
│       ├── common.json
│       ├── pages.json
│       └── errors.json
├── lib/
│   └── i18n.ts                # i18n 인스턴스
└── app/
    ├── layout.tsx             # Provider 설정
    └── page.tsx               # 사용
```

### lib/i18n.ts

```typescript
import { createI18nFromConfigFile } from 'i18nexus';

// 번역 파일 import (수동 또는 자동 생성)
import common_en from '../locales/en/common.json';
import common_ko from '../locales/ko/common.json';
import pages_en from '../locales/en/pages.json';
import pages_ko from '../locales/ko/pages.json';

const translations = {
  en: {
    common: common_en,
    pages: pages_en
  },
  ko: {
    common: common_ko,
    pages: pages_ko
  }
};

// Config 파일 기반 자동 초기화
export const i18n = await createI18nFromConfigFile(translations);
```

---

## 🔧 CLI 도구 (향후 지원 예정)

```bash
# Config 파일 생성
npx i18nexus init

# Config 검증
npx i18nexus validate

# 번역 완성도 체크
npx i18nexus check

# 번역 파일 생성
npx i18nexus generate
```

---

## 🎛️ 설정 우선순위

1. **명시적 props** (가장 높음)
2. **환경 변수** (`I18NEXUS_CONFIG`)
3. **Config 파일** (`i18nexus.config.json`)
4. **기본값** (가장 낮음)

```typescript
// 1. 명시적 props (최우선)
<I18nConfigProvider
  config={explicitConfig}
  translations={translations}
/>

// 2. 환경 변수
process.env.I18NEXUS_CONFIG = '{"defaultLanguage":"ko"}'

// 3. Config 파일
// i18nexus.config.json

// 4. 기본값
// defaultConfig 사용
```

---

## 📊 Config vs 코드 비교

### ❌ Before (코드에 하드코딩)

```typescript
const i18n = createI18nWithFallback(
  translations,
  {
    defaultNamespace: "common",
    fallbackChain: {
      "pages": ["common"],
      "errors": ["common"]
    },
    languageFallback: {
      "ko": ["en"]
    }
  }
);
```

**문제점:**
- 클라이언트/서버에서 중복 코드
- 설정 변경 시 코드 수정 필요
- 환경별 설정 어려움

### ✅ After (Config 파일)

```json
// i18nexus.config.json
{
  "namespaces": {
    "defaultNamespace": "common",
    "fallbackChain": {
      "pages": ["common"],
      "errors": ["common"]
    }
  },
  "fallback": {
    "languages": {
      "ko": ["en"]
    }
  }
}
```

```typescript
// lib/i18n.ts
const i18n = await createI18nFromConfigFile(translations);
```

**장점:**
- 설정 중앙 관리
- 클라이언트/서버 공유
- 환경별 설정 파일 교체 가능
- Git으로 설정 버전 관리

---

## 🌍 다중 환경 설정

### 개발 환경

```json
// i18nexus.config.dev.json
{
  "defaultLanguage": "en",
  "fallback": {
    "showWarnings": true
  },
  "devtools": {
    "enabled": true
  },
  "validation": {
    "enabled": true,
    "strict": false
  }
}
```

### 프로덕션 환경

```json
// i18nexus.config.prod.json
{
  "defaultLanguage": "en",
  "fallback": {
    "showWarnings": false
  },
  "devtools": {
    "enabled": false
  },
  "validation": {
    "enabled": false,
    "strict": true
  },
  "client": {
    "cacheTranslations": true
  }
}
```

### 로드

```typescript
const configPath = process.env.NODE_ENV === 'production'
  ? './i18nexus.config.prod.json'
  : './i18nexus.config.dev.json';

const i18n = await createI18nFromConfigFile(translations, {
  configPath
});
```

---

## ✅ Best Practices

### 1. **항상 Config 파일 사용**
```json
// ✅ Good
i18nexus.config.json에 정의

// ❌ Bad
코드에 하드코딩
```

### 2. **환경별 Config 분리**
```
i18nexus.config.json        # 기본
i18nexus.config.dev.json    # 개발
i18nexus.config.prod.json   # 프로덕션
```

### 3. **Git에 Config 포함**
```gitignore
# .gitignore
i18nexus.config.local.json  # 로컬 오버라이드는 제외
```

### 4. **타입 안전 Config**
```typescript
import type { I18nexusConfig } from 'i18nexus';

const config: I18nexusConfig = {
  // 타입 체크됨!
  defaultLanguage: "en",
  languages: [...]
};
```

---

## 🚀 마이그레이션

### Step 1: Config 파일 생성

```json
// i18nexus.config.json
{
  "defaultLanguage": "en",
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "ko", "name": "한국어" }
  ],
  "namespaces": {
    "enabled": true,
    "fallbackChain": {
      "pages": ["common"]
    }
  }
}
```

### Step 2: 기존 코드 수정

```typescript
// Before
const i18n = createI18nWithFallback(translations, {
  fallbackChain: { "pages": ["common"] },
  languageFallback: { "ko": ["en"] }
});

// After
const i18n = await createI18nFromConfigFile(translations);
```

### Step 3: Provider 업데이트

```typescript
// Before
<I18nProvider
  translations={translations}
  languageManagerOptions={{
    languages: [...]
  }}
>

// After
<I18nConfigProvider translations={translations}>
  {children}
</I18nConfigProvider>
```

---

## 요약

- ✅ **모든 설정을 `i18nexus.config.json`에 정의**
- ✅ **`createI18nFromConfigFile()` 사용**
- ✅ **클라이언트/서버에서 Config 공유**
- ✅ **환경별 Config 파일 사용**
- ✅ **타입 안전한 Config 관리**

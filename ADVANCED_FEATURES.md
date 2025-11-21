# i18nexus 고급 기능 가이드 (Advanced Features)

## 🚀 개요

i18nexus는 이제 다음과 같은 고급 기능들을 제공합니다:

1. **변수 타입 추론** - 번역 문자열의 `{{variable}}` 자동 검증
2. **서버 사이드 타입 안전성** - 서버에서도 완전한 타입 추론
3. **네임스페이스 지원** - 중첩 객체로 대규모 프로젝트 관리
4. **번역 완성도 검증** - CI/CD에서 번역 누락 자동 감지
5. **복수형 지원** - Unicode CLDR 기반 복수형 처리

---

## 1. 변수 타입 추론 (Variable Type Inference)

### 🎯 문제점
기존에는 번역 문자열의 변수가 필수인지 선택적인지 타입 시스템이 알 수 없었습니다.

```typescript
// 기존 방식 - 변수 타입 체크 안됨
const { t } = useTranslation();
t("greeting");  // greeting이 "Hello {{name}}"이라면?
// ❌ 런타임 에러! name 변수가 없음
```

### ✅ 해결책: `createI18nAdvanced()`

```typescript
import { createI18nAdvanced } from 'i18nexus';

const i18n = createI18nAdvanced({
  en: {
    greeting: "Hello {{name}}!",
    itemCount: "You have {{count}} items",
    simple: "No variables here"
  },
  ko: {
    greeting: "{{name}}님 안녕하세요!",
    itemCount: "{{count}}개의 아이템이 있습니다",
    simple: "변수 없음"
  }
});

function MyComponent() {
  const { t } = i18n.useTranslation();

  // ✅ 변수 필수 - 타입 체크됨!
  t("greeting", { name: "John" });

  // ❌ TypeScript 에러 - name 변수 누락
  t("greeting");

  // ❌ TypeScript 에러 - 잘못된 변수명
  t("greeting", { username: "John" });

  // ✅ 변수 없는 번역 - 변수 선택적
  t("simple");
  t("simple", { extra: "ok" });  // 선택적 변수 OK

  return <div>{t("greeting", { name: "World" })}</div>;
}
```

### 타입 추출

```typescript
import type { ExtractRequiredVariables } from 'i18nexus';

const translations = {
  en: { greeting: "Hello {{name}} {{last}}" }
};

// 필수 변수 타입 추출
type Vars = ExtractRequiredVariables<typeof translations.en, "greeting">;
// Result: { name: string | number, last: string | number }
```

---

## 2. 서버 사이드 타입 안전성 (Server-Side Type Safety)

### 기존 서버 API
```typescript
// 기존 - 타입 체크 없음
import { createServerI18n } from 'i18nexus/server';
const { t } = await createServerI18n();
t("greeting", { name: "John" });  // 타입 체크 안됨
```

### 🚀 새로운 고급 서버 API

```typescript
import { createServerI18nTyped } from 'i18nexus/server-advanced';

const translations = {
  en: {
    greeting: "Hello {{name}}!",
    farewell: "Goodbye"
  },
  ko: {
    greeting: "{{name}}님 안녕하세요!",
    farewell: "안녕히 가세요"
  }
};

// 타입 안전 서버 i18n 인스턴스 생성
const serverI18n = createServerI18nTyped(translations);

export default async function ServerPage() {
  const headersList = await headers();
  const { t, language } = serverI18n.create(headersList, {
    availableLanguages: ["en", "ko"],
    defaultLanguage: "ko"
  });

  // ✅ 변수 타입 체크됨!
  return (
    <div>
      <h1>{t("greeting", { name: "Server User" })}</h1>

      {/* ❌ TypeScript 에러 - name 변수 누락 */}
      {/* <h1>{t("greeting")}</h1> */}

      <p>{t("farewell")}</p>
    </div>
  );
}
```

### 간편한 방식

```typescript
import { createTypedServerTranslation } from 'i18nexus/server-advanced';

export default async function Page() {
  const { t, language } = await createTypedServerTranslation(translations, {
    availableLanguages: ["en", "ko"],
    defaultLanguage: "ko"
  });

  return <h1>{t("greeting", { name: "World" })}</h1>;
}
```

---

## 3. 네임스페이스 지원 (Namespace Support)

### 대규모 프로젝트의 문제점
```typescript
// 문제: 수백 개의 번역 키가 한 곳에...
const translations = {
  en: {
    homePageTitle: "Home",
    homePageSubtitle: "Welcome",
    aboutPageTitle: "About",
    aboutPageSubtitle: "About us",
    errorNotFound: "Not found",
    errorUnauthorized: "Unauthorized",
    // ... 수백 개 더...
  }
};
```

### ✅ 해결책: 네임스페이스로 구조화

```typescript
import { createI18nNamespace } from 'i18nexus';

const i18n = createI18nNamespace({
  en: {
    common: {
      greeting: "Hello {{name}}!",
      farewell: "Goodbye"
    },
    pages: {
      home: {
        title: "Home Page",
        subtitle: "Welcome to our site"
      },
      about: {
        title: "About Us",
        subtitle: "Learn more about our company"
      }
    },
    errors: {
      notFound: "Page not found",
      unauthorized: "You are not authorized",
      serverError: "Server error occurred"
    },
    forms: {
      validation: {
        required: "This field is required",
        email: "Invalid email format",
        minLength: "Minimum {{length}} characters"
      }
    }
  },
  ko: {
    common: {
      greeting: "{{name}}님 안녕하세요!",
      farewell: "안녕히 가세요"
    },
    pages: {
      home: {
        title: "홈 페이지",
        subtitle: "사이트에 오신 것을 환영합니다"
      },
      about: {
        title: "회사 소개",
        subtitle: "우리 회사에 대해 알아보세요"
      }
    },
    errors: {
      notFound: "페이지를 찾을 수 없습니다",
      unauthorized: "권한이 없습니다",
      serverError: "서버 오류가 발생했습니다"
    },
    forms: {
      validation: {
        required: "필수 항목입니다",
        email: "이메일 형식이 올바르지 않습니다",
        minLength: "최소 {{length}}자 이상 입력하세요"
      }
    }
  }
});

// 사용: 점 표기법 (Dot Notation)
function MyComponent() {
  const { t } = i18n.useTranslation();

  return (
    <div>
      {/* ✅ 네임스페이스로 구조화된 키 */}
      <h1>{t("pages.home.title")}</h1>
      <p>{t("pages.home.subtitle")}</p>

      {/* ✅ 자동완성 지원 */}
      <p>{t("common.greeting", { name: "John" })}</p>

      {/* ✅ 에러 메시지 그룹화 */}
      <ErrorBoundary>
        {error && <p>{t("errors.notFound")}</p>}
      </ErrorBoundary>

      {/* ✅ 폼 검증 메시지 */}
      <input required />
      {errors.name && <p>{t("forms.validation.required")}</p>}
    </div>
  );
}
```

### 네임스페이스 키 추출

```typescript
import { getNestedKeys } from 'i18nexus';

const keys = getNestedKeys({
  common: { greeting: "Hello" },
  errors: { notFound: "Not found" }
});
// ["common.greeting", "errors.notFound"]
```

---

## 4. 번역 완성도 검증 (Translation Validation)

### CI/CD에서 번역 누락 감지

```typescript
import {
  validateTranslationCompleteness,
  generateCoverageReport,
  assertTranslationCompleteness
} from 'i18nexus';

const translations = {
  en: { greeting: "Hello", farewell: "Goodbye", welcome: "Welcome" },
  ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" }
  // Missing: welcome
};

// 1. 검증
const result = validateTranslationCompleteness(translations);

console.log(result);
// {
//   valid: false,
//   missingKeys: [
//     { language: "ko", keys: ["welcome"] }
//   ],
//   extraKeys: [],
//   allKeys: ["greeting", "farewell", "welcome"]
// }

// 2. 리포트 생성
const report = generateCoverageReport(translations);
console.log(report);
// Translation Coverage Report
// ===========================
// Total keys: 3
// Languages: en, ko
//
// Coverage:
//   en: 100% (3/3)
//   ko: 66.67% (2/3)
//
// Missing translations:
//   ko: welcome
//
// ❌ Found 1 missing translations

// 3. CI/CD에서 assert (테스트 실패)
try {
  assertTranslationCompleteness(translations);
} catch (error) {
  console.error(error.message);
  process.exit(1);  // CI 실패
}
```

### 번역 완성도 통계

```typescript
import { getTranslationStats } from 'i18nexus';

const stats = getTranslationStats({
  en: { greeting: "Hello", farewell: "Goodbye", welcome: "Welcome" },
  ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" }
});

console.log(stats);
// { en: 100, ko: 66.67 }
```

### 네임스페이스 검증

```typescript
import { validateNestedTranslationCompleteness } from 'i18nexus';

const result = validateNestedTranslationCompleteness({
  en: {
    common: { greeting: "Hello" },
    errors: { notFound: "Not found" }
  },
  ko: {
    common: { greeting: "안녕하세요" }
    // Missing: errors.notFound
  }
});

console.log(result.missingKeys);
// [{ language: "ko", keys: ["errors.notFound"] }]
```

---

## 5. 복수형 지원 (Pluralization)

### Unicode CLDR 기반 복수형

```typescript
import {
  getPluralForm,
  selectPlural,
  pluralize,
  createPluralTranslation
} from 'i18nexus';

// 1. 간단한 복수형 (영어)
pluralize(0, "item");   // "items"
pluralize(1, "item");   // "item"
pluralize(5, "item");   // "items"
pluralize(2, "box", "boxes");  // "boxes"

// 2. 언어별 복수형 규칙
getPluralForm(1, "en");   // "one"
getPluralForm(2, "en");   // "other"
getPluralForm(1, "ko");   // "other" (한국어는 복수형 없음)
getPluralForm(1, "ru");   // "one"
getPluralForm(2, "ru");   // "few"
getPluralForm(5, "ru");   // "many"

// 3. 복수형 옵션 선택
const result = selectPlural(
  5,
  {
    zero: "no items",
    one: "one item",
    other: "{{count}} items"
  },
  "en"
);
// "5 items"

// 4. 번역 객체에서 복수형 사용
const translations = {
  en: {
    items_plural: {
      zero: "no items",
      one: "one item",
      other: "{{count}} items"
    },
    users_plural: {
      one: "{{count}} user",
      other: "{{count}} users"
    }
  }
};

const plural = createPluralTranslation("en", translations.en);
console.log(plural("items", 0));   // "no items"
console.log(plural("items", 1));   // "one item"
console.log(plural("items", 5));   // "5 items"
console.log(plural("users", 1));   // "1 user"
console.log(plural("users", 10));  // "10 users"
```

### React 컴포넌트에서 사용

```typescript
import { pluralWithInterpolation } from 'i18nexus';

function ItemList({ items }: { items: any[] }) {
  const count = items.length;

  const message = pluralWithInterpolation(
    count,
    {
      zero: "No items in {{location}}",
      one: "One item in {{location}}",
      other: "{{count}} items in {{location}}"
    },
    "en",
    { location: "cart" }
  );

  return <p>{message}</p>;
  // count = 0: "No items in cart"
  // count = 1: "One item in cart"
  // count = 5: "5 items in cart"
}
```

### 지원 언어별 복수형 형태

```typescript
import { getSupportedPluralForms } from 'i18nexus';

getSupportedPluralForms("en");  // ["one", "other"]
getSupportedPluralForms("ko");  // ["other"]
getSupportedPluralForms("ru");  // ["one", "few", "many"]
getSupportedPluralForms("ar");  // ["zero", "one", "two", "few", "many", "other"]
```

---

## 📊 기능 비교표

| 기능 | `createI18n` | `createI18nAdvanced` | `createI18nNamespace` |
|------|-------------|---------------------|----------------------|
| 번역 키 타입 추론 | ✅ | ✅ | ✅ |
| 변수 타입 추론 | ❌ | ✅ | ✅ |
| 네임스페이스 지원 | ❌ | ❌ | ✅ |
| 복수형 지원 | 수동 | 수동 | 수동 |
| 성능 | 빠름 | 빠름 | 약간 느림 (flatten) |

---

## 🎯 권장 사용 패턴

### 소규모 프로젝트
```typescript
import { createI18n } from 'i18nexus';

const i18n = createI18n({ /* ... */ });
// 간단하고 빠름
```

### 중규모 프로젝트 (변수 많이 사용)
```typescript
import { createI18nAdvanced } from 'i18nexus';

const i18n = createI18nAdvanced({ /* ... */ });
// 변수 타입 체크 필수
```

### 대규모 프로젝트 (수백 개 키)
```typescript
import { createI18nNamespace } from 'i18nexus';

const i18n = createI18nNamespace({
  en: {
    common: { /* ... */ },
    pages: { /* ... */ },
    errors: { /* ... */ }
  }
});
// 구조화된 관리
```

---

## 🔧 CI/CD 통합 예제

### GitHub Actions

```yaml
# .github/workflows/i18n-check.yml
name: Translation Check

on: [push, pull_request]

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - name: Check translation completeness
        run: node scripts/check-translations.js
```

### 검증 스크립트

```javascript
// scripts/check-translations.js
import { assertTranslationCompleteness, generateCoverageReport } from 'i18nexus';
import { translations } from '../lib/i18n.js';

try {
  console.log(generateCoverageReport(translations));
  assertTranslationCompleteness(translations);
  console.log('✅ All translations are complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Translation validation failed!');
  console.error(error.message);
  process.exit(1);
}
```

---

## 📚 다음 단계

1. **기본 사용법**: `USAGE_EXAMPLE.md` 참고
2. **마이그레이션**: 기존 코드에서 고급 기능으로 전환
3. **CI/CD 설정**: 번역 검증 자동화
4. **네임스페이스 설계**: 대규모 프로젝트 구조화

---

## 🎓 학습 리소스

- [TypeScript 고급 타입](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Unicode CLDR Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- [React i18n Best Practices](https://react.i18next.com/latest/using-with-hooks)

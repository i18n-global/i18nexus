# Namespace Fallback & Dynamic Translation Guide

## 🎯 목차

1. [Namespace Fallback](#1-namespace-fallback-시스템)
2. [Dynamic Translation Wrapper](#2-dynamic-translation-wrapper)
3. [실전 예제](#3-실전-예제)
4. [Best Practices](#4-best-practices)

---

## 1. Namespace Fallback 시스템

### 문제점

기존 네임스페이스는 번역이 없을 때 키를 그대로 반환했습니다:

```typescript
const { t } = i18n.useTranslation();

t("pages.home.greeting");
// 만약 없으면 => "pages.home.greeting" (키 그대로)
```

### 해결책: Fallback 체인

```typescript
import { createI18nWithFallback } from 'i18nexus';

const i18n = createI18nWithFallback(
  {
    en: {
      common: {
        greeting: "Hello",
        farewell: "Goodbye",
        loading: "Loading..."
      },
      pages: {
        home: {
          title: "Home Page"
          // greeting이 없음!
        },
        about: {
          title: "About Us"
          // greeting, farewell 모두 없음!
        }
      },
      errors: {
        notFound: "Not Found"
        // loading이 없음!
      }
    },
    ko: {
      common: {
        greeting: "안녕하세요"
        // farewell, loading이 없음!
      }
    }
  },
  {
    // 1. 기본 네임스페이스
    defaultNamespace: "common",

    // 2. 네임스페이스 fallback 체인
    fallbackChain: {
      "pages": ["common"],      // pages -> common
      "errors": ["common"],      // errors -> common
    },

    // 3. 언어 fallback
    languageFallback: {
      "ko": ["en"]  // ko -> en
    },

    // 4. 경고 표시 (개발 시 유용)
    showWarnings: true
  }
);
```

### 사용 예제

```typescript
function MyComponent() {
  const { t, hasKey } = i18n.useTranslation();

  // ✅ 직접 찾기 (common.greeting)
  t("common.greeting");  // "안녕하세요"

  // ✅ Namespace fallback: pages.greeting -> common.greeting
  t("pages.greeting");   // "안녕하세요" (common에서 가져옴)

  // ✅ Language fallback: ko.common.farewell -> en.common.farewell
  t("common.farewell");  // "Goodbye" (en에서 가져옴)

  // ✅ Combined: pages.loading -> common.loading (ko -> en)
  t("pages.loading");    // "Loading..." (en.common에서 가져옴)

  // ✅ 키 존재 확인
  if (hasKey("pages.greeting")) {
    // ...
  }

  return <div>{t("pages.greeting")}</div>;
}
```

### Fallback 순서

키를 찾는 순서:

1. **직접 히트**: 현재 언어의 정확한 키
2. **네임스페이스 fallback**: 현재 언어의 fallback 네임스페이스
3. **기본 네임스페이스**: defaultNamespace가 설정된 경우
4. **언어 fallback**: fallback 언어의 정확한 키
5. **언어 + 네임스페이스 fallback**: fallback 언어의 fallback 네임스페이스
6. **키 반환**: 모두 실패하면 키 그대로 반환

### Scoped Translation

특정 네임스페이스만 사용하는 경우:

```typescript
import { useScopedTranslation } from 'i18nexus';

function ErrorBoundary() {
  // "errors." 접두사가 자동으로 붙음
  const t = useScopedTranslation("errors");

  return (
    <div>
      {/* t("errors.notFound") 대신 */}
      <p>{t("notFound")}</p>
      <p>{t("unauthorized")}</p>
      <p>{t("serverError")}</p>
    </div>
  );
}
```

수동으로 스코프 생성:

```typescript
import { createScopedTranslation } from 'i18nexus';

function MyComponent() {
  const { t } = useTranslation();
  const tPages = createScopedTranslation(t, "pages");
  const tErrors = createScopedTranslation(t, "errors");

  return (
    <div>
      <h1>{tPages("home.title")}</h1>
      <p>{tErrors("notFound")}</p>
    </div>
  );
}
```

---

## 2. Dynamic Translation Wrapper

### 문제점

타입 안전 번역은 **컴파일 타임에 키를 알아야** 합니다:

```typescript
const { t } = useTranslation();

// ❌ 타입 에러! 동적 키는 타입 체크 불가
const errorCode = props.errorCode;
t(`errors.${errorCode}`);

// ❌ 변수로 키 생성
const status = user.status;
t(`status.${status}`);
```

### 해결책: Dynamic Translation

```typescript
import { useDynamicTranslation } from 'i18nexus';

function ErrorDisplay({ errorCode }: { errorCode: string }) {
  const tDynamic = useDynamicTranslation({
    prefix: "errors",
    fallback: "Unknown error"
  });

  // ✅ 동적 키 허용 (타입 체크 없음)
  return <div>{tDynamic(errorCode)}</div>;
  // errorCode가 "404"면 => "errors.404"
}
```

### 기본 사용법

```typescript
import { useDynamicTranslation } from 'i18nexus';

function StatusBadge({ status }: { status: string }) {
  const tDynamic = useDynamicTranslation();

  // 동적 키 생성
  const statusText = tDynamic(`status.${status}`);

  return <span className={`badge-${status}`}>{statusText}</span>;
}
```

### Prefix 사용

```typescript
const tErrors = useDynamicTranslation({ prefix: "errors" });

// 자동으로 "errors." 접두사 추가
tErrors("404");        // => t("errors.404")
tErrors("notFound");   // => t("errors.notFound")
tErrors("500");        // => t("errors.500")
```

### Fallback 설정

```typescript
const tDynamic = useDynamicTranslation({
  fallback: "Translation missing",
  showWarnings: true  // 개발 시 경고 표시
});

// 키가 없어도 안전
tDynamic("non.existent.key");  // "Translation missing"
```

### Transform 함수

```typescript
// 키를 대문자로 변환
const tUpper = useDynamicTranslation({
  transform: (key) => key.toUpperCase()
});

tUpper("greeting");  // => t("GREETING")

// 언더스코어를 점으로 변환
const tSnake = useDynamicTranslation({
  transform: (key) => key.replace(/_/g, ".")
});

tSnake("common_greeting");  // => t("common.greeting")
```

### Scope 기능

```typescript
const tDynamic = useDynamicTranslation({ prefix: "errors" });

// 하위 스코프 생성
const tHttp = tDynamic.scope("http");
const tValidation = tDynamic.scope("validation");

tHttp("404");        // => "errors.http.404"
tValidation("required");  // => "errors.validation.required"
```

### 배열 매핑

```typescript
import { mapDynamicTranslations, useDynamicTranslation } from 'i18nexus';

function ErrorList({ errorCodes }: { errorCodes: string[] }) {
  const tErrors = useDynamicTranslation({ prefix: "errors" });

  const errorMessages = mapDynamicTranslations(errorCodes, tErrors);
  // ["404", "500"] => ["Not Found", "Server Error"]

  return (
    <ul>
      {errorMessages.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  );
}
```

### Map 생성

```typescript
import { useDynamicTranslationMap } from 'i18nexus';

function StatusBadge({ status }: { status: string }) {
  // 자동으로 매핑 생성
  const statusMap = useDynamicTranslationMap(
    ["active", "inactive", "pending", "blocked"],
    { prefix: "status" }
  );
  // {
  //   active: "Active",
  //   inactive: "Inactive",
  //   pending: "Pending",
  //   blocked: "Blocked"
  // }

  return <span>{statusMap[status] || status}</span>;
}
```

### 단일 값 Hook

```typescript
import { useDynamicTranslationValue } from 'i18nexus';

function ErrorMessage({ code }: { code: string }) {
  // 단일 값만 필요한 경우
  const message = useDynamicTranslationValue(
    `errors.${code}`,
    { fallback: "Unknown error" }
  );

  return <div className="error">{message}</div>;
}
```

### 유틸리티 메서드

```typescript
const tDynamic = useDynamicTranslation();

// 1. 키 존재 확인
if (tDynamic.hasKey(`status.${status}`)) {
  // ...
}

// 2. 원본 번역 가져오기 (변수 없이)
const raw = tDynamic.getRaw("greeting");

// 3. 스코프 생성
const tErrors = tDynamic.scope("errors");
```

---

## 3. 실전 예제

### 예제 1: API 응답 에러 처리

```typescript
const translations = {
  en: {
    errors: {
      api: {
        "400": "Bad Request",
        "401": "Unauthorized",
        "403": "Forbidden",
        "404": "Not Found",
        "500": "Server Error"
      }
    }
  }
};

function ApiErrorDisplay({ error }: { error: ApiError }) {
  const tErrors = useDynamicTranslation({
    prefix: "errors.api",
    fallback: "An error occurred"
  });

  return (
    <div className="error">
      <h3>{tErrors(String(error.status))}</h3>
      <p>{error.message}</p>
    </div>
  );
}
```

### 예제 2: 폼 검증 에러

```typescript
interface ValidationErrors {
  email?: string;
  password?: string;
  name?: string;
}

function FormErrors({ errors }: { errors: ValidationErrors }) {
  const tValidation = useDynamicTranslation({
    prefix: "forms.validation",
    fallback: "Validation error"
  });

  return (
    <div className="errors">
      {Object.entries(errors).map(([field, error]) => (
        <p key={field}>
          {field}: {tValidation(error)}
        </p>
      ))}
    </div>
  );
}
```

### 예제 3: 다국어 상태 뱃지

```typescript
const i18n = createI18nWithFallback(
  {
    en: {
      status: {
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
        blocked: "Blocked"
      },
      common: {
        unknown: "Unknown"
      }
    }
  },
  {
    fallbackChain: {
      "status": ["common"]
    }
  }
);

function StatusBadge({ status }: { status: string }) {
  const statusMap = useDynamicTranslationMap(
    ["active", "inactive", "pending", "blocked"],
    { prefix: "status" }
  );

  const text = statusMap[status] || status;

  return (
    <span className={`badge badge-${status}`}>
      {text}
    </span>
  );
}
```

### 예제 4: 동적 메뉴

```typescript
interface MenuItem {
  id: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { id: "home", icon: "🏠" },
  { id: "profile", icon: "👤" },
  { id: "settings", icon: "⚙️" },
  { id: "logout", icon: "🚪" }
];

function Navigation() {
  const menuMap = useDynamicTranslationMap(
    menuItems.map(item => item.id),
    { prefix: "menu" }
  );

  return (
    <nav>
      {menuItems.map(item => (
        <a key={item.id} href={`/${item.id}`}>
          <span>{item.icon}</span>
          <span>{menuMap[item.id]}</span>
        </a>
      ))}
    </nav>
  );
}
```

### 예제 5: Namespace + Dynamic 조합

```typescript
const i18n = createI18nWithFallback(
  {
    en: {
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete"
      },
      buttons: {
        // save, cancel은 없음 (fallback 사용)
        delete: "Delete Item"  // 덮어쓰기
      },
      errors: {
        validation: {
          required: "Required field",
          email: "Invalid email",
          minLength: "Too short"
        }
      }
    }
  },
  {
    fallbackChain: {
      "buttons": ["common"]
    }
  }
);

function SmartForm({ errors }: { errors: Record<string, string> }) {
  const { t } = i18n.useTranslation();
  const tErrors = useDynamicTranslation({
    prefix: "errors.validation",
    fallback: "Validation error"
  });

  return (
    <form>
      {/* Static translations with fallback */}
      <button>{t("buttons.save")}</button>  {/* common.save */}
      <button>{t("buttons.cancel")}</button>  {/* common.cancel */}
      <button>{t("buttons.delete")}</button>  {/* buttons.delete */}

      {/* Dynamic translations */}
      <div className="errors">
        {Object.entries(errors).map(([field, error]) => (
          <p key={field}>{tErrors(error)}</p>
        ))}
      </div>
    </form>
  );
}
```

---

## 4. Best Practices

### ✅ DO

1. **Namespace Fallback 사용**
   ```typescript
   // 공통 번역을 common에 두고 재사용
   const i18n = createI18nWithFallback(translations, {
     fallbackChain: { "pages": ["common"], "modals": ["common"] }
   });
   ```

2. **Dynamic은 정말 필요할 때만**
   ```typescript
   // ✅ API 응답, 동적 상태 등
   const tErrors = useDynamicTranslation({ prefix: "errors" });
   tErrors(apiError.code);

   // ❌ 정적 키는 일반 t() 사용
   t("common.greeting");  // 타입 안전!
   ```

3. **Prefix로 범위 제한**
   ```typescript
   // ✅ prefix로 네임스페이스 명시
   const tStatus = useDynamicTranslation({ prefix: "status" });

   // ❌ 전체 키 사용
   const tDynamic = useDynamicTranslation();
   ```

4. **Fallback 항상 설정**
   ```typescript
   // ✅ 안전한 fallback
   const tDynamic = useDynamicTranslation({
     fallback: "Unknown"
   });
   ```

### ❌ DON'T

1. **모든 곳에 Dynamic 사용하지 말기**
   ```typescript
   // ❌ 타입 안전성 포기
   const tDynamic = useDynamicTranslation();
   tDynamic("common.greeting");

   // ✅ 정적 키는 일반 t() 사용
   const { t } = useTranslation();
   t("common.greeting");
   ```

2. **과도한 Fallback 체인**
   ```typescript
   // ❌ 너무 복잡
   fallbackChain: {
     "pages": ["common", "global", "default", "fallback"]
   }

   // ✅ 단순하게
   fallbackChain: {
     "pages": ["common"]
   }
   ```

3. **Namespace 남용**
   ```typescript
   // ❌ 너무 깊은 중첩
   t("app.pages.home.sections.hero.buttons.primary.text")

   // ✅ 적절한 깊이
   t("pages.home.heroButton")
   ```

---

## 5. 마이그레이션 가이드

### 기존 코드에서 전환

**Before:**
```typescript
const i18n = createI18nNamespace(translations);

const { t } = i18n.useTranslation();
t("pages.home.greeting");  // 없으면 키 반환
```

**After:**
```typescript
const i18n = createI18nWithFallback(
  translations,
  {
    fallbackChain: {
      "pages": ["common"]
    },
    languageFallback: {
      "ko": ["en"]
    }
  }
);

const { t } = i18n.useTranslation();
t("pages.home.greeting");  // 없으면 common.greeting 사용
```

---

## 6. 성능 고려사항

### Namespace Fallback
- **오버헤드**: 미미함 (키 조회 몇 번 추가)
- **권장**: 대부분의 프로젝트에서 사용 가능

### Dynamic Translation
- **오버헤드**: 낮음 (React memo 최적화됨)
- **주의**: 렌더링마다 키가 변경되지 않도록 주의

```typescript
// ❌ 매번 새로운 키 생성
const key = `status.${Math.random()}`;
tDynamic(key);

// ✅ 안정적인 키
const key = `status.${user.status}`;
tDynamic(key);
```

---

## 7. TypeScript 타입 안전성

| 기능 | 타입 안전성 | 자동완성 | 용도 |
|------|-----------|---------|------|
| `t()` | ✅ 완전 | ✅ | 정적 키 |
| `createI18nWithFallback` | ✅ 완전 | ✅ | 정적 키 + fallback |
| `useDynamicTranslation` | ❌ 없음 | ❌ | 동적 키 |

**원칙**: 가능한 한 타입 안전한 방법 사용, 동적 키가 필요할 때만 Dynamic 사용

---

## 요약

- **Namespace Fallback**: 번역 누락을 자동으로 처리
- **Dynamic Translation**: 런타임 키 생성 (타입 체크 없음)
- **함께 사용**: 최대의 유연성과 안전성

# Wrapper Array Duplication Issue

## 문제 상황 (Problem)

현재 `i18n-wrapper`가 배열 리터럴과 배열 요소 접근을 모두 래핑하여 중복 번역이 발생합니다.

### 예시 1: 기본 배열 (컴포넌트 내부)

**Before (원본 코드):**

```tsx
export default function Component() {
  const data = ["데이터1", "데이터2"];

  return (
    <div>
      {data.map((item) => (
        <p>{item}</p>
      ))}
    </div>
  );
}
```

**Current Behavior (현재 동작 - 문제):**

```tsx
export default function Component() {
  const data = [t("데이터1"), t("데이터2")]; // ❌ 배열 리터럴을 래핑

  return (
    <div>
      {data.map((item) => (
        <p>{t(item)}</p>
      ))}{" "}
      // ❌ 또 래핑 (중복!)
    </div>
  );
}
```

### 예시 2: 컴포넌트 외부 상수

**Before (원본 코드):**

```tsx
// 컴포넌트 외부에 선언
const MESSAGES = ["메시지1", "메시지2", "메시지3"];

export default function Component() {
  return (
    <div>
      {MESSAGES.map((msg) => (
        <p>{msg}</p>
      ))}
    </div>
  );
}
```

**Current Behavior (현재 동작 - 문제):**

```tsx
// ❌ 컴포넌트 외부라 wrapper가 처리 못함
const MESSAGES = ["메시지1", "메시지2", "메시지3"];

export default function Component() {
  const { t } = useTranslation(); // wrapper가 추가
  return (
    <div>
      {MESSAGES.map((msg) => (
        <p>{t(msg)}</p>
      ))}{" "}
      // ✅ 사용처만 래핑
    </div>
  );
}
```

**Extractor 동작:**

```json
// extractor가 t(msg)를 추출 못함 (변수라서)
// locales/ko.json은 비어있음
{}
```

## Extractor와의 관계 분석

### Extractor 동작 원리

`i18n-extractor`는 다음만 추출 가능:

1. `t("직접 문자열")` - 직접 문자열 리터럴
2. `t(CONSTANT_STRING)` - 상수 변수 (상수 분석 후)
3. `t(item.label)` - 객체 속성 (상수 분석 후)

**추출 불가능:**

- `t(variable)` - 일반 변수
- `t(item)` - 배열 요소 변수

### 케이스별 분석

#### 케이스 1: 컴포넌트 내부 배열 (지역 변수)

```tsx
function Component() {
  const data = ["데이터1", "데이터2"];
  return (
    <div>
      {data.map((item) => (
        <p>{item}</p>
      ))}
    </div>
  );
}
```

**Wrapper 옵션 A: 배열 리터럴 래핑**

```tsx
function Component() {
  const data = [t("데이터1"), t("데이터2")]; // wrapper가 래핑
  return (
    <div>
      {data.map((item) => (
        <p>{item}</p>
      ))}
    </div>
  ); // 사용처는 그대로
}
```

- ✅ Extractor가 추출 가능: `t("데이터1")`, `t("데이터2")`
- ❌ 런타임 오버헤드: 컴포넌트 렌더링마다 t() 호출
- ❌ 타입 변경: `string[]` → `TranslatedString[]`

**Wrapper 옵션 B: 사용처만 래핑**

```tsx
function Component() {
  const data = ["데이터1", "데이터2"]; // 배열은 그대로
  return (
    <div>
      {data.map((item) => (
        <p>{t(item)}</p>
      ))}
    </div>
  ); // 사용처 래핑
}
```

- ❌ Extractor가 추출 불가: `t(item)`은 변수라서
- ✅ 타입 유지: `string[]` 그대로
- ✅ 런타임 효율적: 렌더링 시점에만 t() 호출

#### 케이스 2: 컴포넌트 외부 상수

```tsx
const MESSAGES = ["메시지1", "메시지2"];

function Component() {
  return (
    <div>
      {MESSAGES.map((msg) => (
        <p>{msg}</p>
      ))}
    </div>
  );
}
```

**Wrapper 옵션 A: 배열 리터럴 래핑 시도**

```tsx
// ❌ Wrapper는 컴포넌트 내부만 처리하므로 이 배열은 그대로
const MESSAGES = ["메시지1", "메시지2"];

function Component() {
  return (
    <div>
      {MESSAGES.map((msg) => (
        <p>{t(msg)}</p>
      ))}
    </div>
  );
}
```

- ❌ Extractor 추출 불가: `t(msg)`은 변수
- 결과: 번역 안됨

**Wrapper 옵션 B: 사용처만 래핑 (현재와 동일)**

```tsx
const MESSAGES = ["메시지1", "메시지2"];

function Component() {
  return (
    <div>
      {MESSAGES.map((msg) => (
        <p>{t(msg)}</p>
      ))}
    </div>
  );
}
```

- ❌ Extractor 추출 불가: `t(msg)`은 변수
- 결과: 번역 안됨

#### 케이스 3: 객체 배열 (컴포넌트 내부)

```tsx
function Component() {
  const items = [
    { label: "홈", path: "/" },
    { label: "소개", path: "/about" },
  ];
  return (
    <nav>
      {items.map((item) => (
        <a>{item.label}</a>
      ))}
    </nav>
  );
}
```

**Wrapper 옵션 A: 배열 리터럴 래핑**

```tsx
function Component() {
  const items = [
    { label: t("홈"), path: "/" },
    { label: t("소개"), path: "/about" },
  ];
  return (
    <nav>
      {items.map((item) => (
        <a>{item.label}</a>
      ))}
    </nav>
  );
}
```

- ✅ Extractor 추출 가능: `t("홈")`, `t("소개")`
- ❌ 런타임 오버헤드
- ❌ 타입 복잡도 증가

**Wrapper 옵션 B: 사용처만 래핑**

```tsx
function Component() {
  const items = [
    { label: "홈", path: "/" },
    { label: "소개", path: "/about" },
  ];
  return (
    <nav>
      {items.map((item) => (
        <a>{t(item.label)}</a>
      ))}
    </nav>
  );
}
```

- ✅ Extractor 추출 가능: `t(item.label)` → 상수 분석으로 `"홈"`, `"소개"` 추출
- ✅ 타입 유지
- ✅ 런타임 효율적

#### 케이스 4: 객체 배열 (컴포넌트 외부)

```tsx
const NAV_ITEMS = [
  { label: "홈", path: "/" },
  { label: "소개", path: "/about" },
];

function Component() {
  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <a>{item.label}</a>
      ))}
    </nav>
  );
}
```

**Wrapper 동작:**

```tsx
const NAV_ITEMS = [
  { label: "홈", path: "/" },
  { label: "소개", path: "/about" },
]; // ❌ 컴포넌트 외부라 wrapper 처리 안함

function Component() {
  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <a>{t(item.label)}</a>
      ))}
    </nav>
  ); // ✅ 사용처 래핑
}
```

- ✅ Extractor 추출 가능: `t(item.label)` → 상수 분석으로 추출
- ✅ 현재 시스템이 정확히 이렇게 동작하고 있음!

## 결론: 현재 시스템 분석

### 현재 Wrapper + Extractor 조합의 문제점

1. **컴포넌트 내부 단순 배열**
   - Wrapper: 리터럴과 사용처 모두 래핑 (중복)
   - Extractor: 리터럴의 t() 호출만 추출
   - **문제**: 중복 래핑

2. **컴포넌트 내부 객체 배열**
   - Wrapper: 리터럴 속성과 사용처 모두 래핑 (중복)
   - Extractor: 리터럴의 t() 호출과 사용처 모두 추출 (중복)
   - **문제**: 중복 래핑 및 중복 추출

3. **컴포넌트 외부 상수**
   - Wrapper: 사용처만 래핑 (정상)
   - Extractor: 상수 분석으로 추출 (정상)
   - **문제 없음**: 현재 정상 동작!

### 해결 방안 재검토

#### 방안 1: 배열/객체 리터럴 내부는 절대 래핑하지 않기 (권장)

**장점:**

- 중복 래핑 문제 완전 해결
- Extractor의 상수 분석 기능 활용
- 타입 안전성 유지
- 런타임 효율적

**단점:**

- 컴포넌트 내부 단순 배열은 수동 처리 필요

```tsx
// Before
const data = ["데이터1", "데이터2"];
{
  data.map((item) => <p>{item}</p>);
}

// After (수동 수정 필요)
const data = ["데이터1", "데이터2"];
{
  data.map((item) => <p>{t(item)}</p>);
} // 사용처만 래핑, extractor는 못 추출

// 해결책: 컴포넌트 외부로 이동
const DATA = ["데이터1", "데이터2"]; // 외부 상수로

function Component() {
  {
    DATA.map((item) => <p>{t(item)}</p>);
  } // extractor가 추출 가능!
}
```

#### 방안 2: 하이브리드 접근

**규칙:**

1. **객체 배열**: 리터럴 래핑 안함, 사용처만 래핑 (extractor가 상수 분석)
2. **단순 배열**:
   - 컴포넌트 외부 → 사용처만 래핑 (extractor가 상수 분석)
   - 컴포넌트 내부 → 리터럴 래핑 (extractor가 직접 추출)

**문제점:**

- 복잡한 규칙
- 예측 어려운 동작
- 유지보수 어려움

## 최종 권장 사항

### 해결책: 배열/객체 리터럴 내부는 래핑하지 않기

**구현:**

```typescript
private shouldSkipPath(path: NodePath<t.StringLiteral>): boolean {
  // ... 기존 체크들 ...

  // 배열 리터럴 내부는 스킵
  if (t.isArrayExpression(path.parent)) {
    return true;
  }

  // 객체 배열 리터럴 내부도 스킵
  if (t.isObjectProperty(path.parent)) {
    const objectExpr = path.parentPath.parentPath?.node;
    if (t.isObjectExpression(objectExpr)) {
      const arrayExpr = path.parentPath.parentPath?.parentPath?.node;
      if (t.isArrayExpression(arrayExpr)) {
        return true;
      }
    }
  }

  return false;
}
```

**사용자 가이드라인:**

1. ✅ **권장**: 번역이 필요한 배열/객체는 컴포넌트 외부에 상수로 선언

   ```tsx
   const NAV_ITEMS = [{ label: "홈" }]; // 파일 최상단

   function Nav() {
     return <>{NAV_ITEMS.map((item) => t(item.label))}</>;
   }
   ```

2. ⚠️ **주의**: 컴포넌트 내부 단순 배열은 수동 래핑 필요

   ```tsx
   function Component() {
     const data = ["데이터1", "데이터2"];
     return (
       <>
         {data.map((item) => (
           <p>{t(item)}</p>
         ))}
       </>
     );
     // 하지만 extractor는 추출 못함 → 외부 상수로 이동 권장
   }
   ```

3. ✅ **대안**: 직접 렌더링하거나 외부 상수로 이동

   ```tsx
   // 옵션 1: 직접 배열 사용
   {
     ["데이터1", "데이터2"].map((item) => <p>{t(item)}</p>);
   }

   // 옵션 2: 외부 상수
   const DATA = ["데이터1", "데이터2"];
   {
     DATA.map((item) => <p>{t(item)}</p>);
   }
   ```

## Breaking Change 고려사항

이 변경은 **Major Version (2.0.0)** 으로 릴리즈 권장:

### 마이그레이션 가이드

**Before (v1.x):**

```tsx
function Component() {
  const items = [{ label: "홈" }]; // wrapper가 래핑
  return (
    <>
      {items.map((i) => (
        <a>{i.label}</a>
      ))}
    </>
  ); // 사용처도 래핑
}
```

**After (v2.x):**

```tsx
// 옵션 1: 외부 상수로 이동 (권장)
const ITEMS = [{ label: "홈" }];
function Component() {
  return (
    <>
      {ITEMS.map((i) => (
        <a>{t(i.label)}</a>
      ))}
    </>
  );
}

// 옵션 2: 컴포넌트 내부 유지 (수동 처리)
function Component() {
  const items = [{ label: "홈" }]; // 리터럴은 그대로
  return (
    <>
      {items.map((i) => (
        <a>{t(i.label)}</a>
      ))}
    </>
  );
}
```

### 체크리스트

- [ ] 단순 배열 리터럴 래핑 방지
- [ ] 객체 배열 리터럴 내부 래핑 방지
- [ ] 중첩 구조 처리
- [ ] 테스트 케이스 작성
- [ ] 마이그레이션 가이드 작성
- [ ] CHANGELOG 업데이트
- [ ] README 업데이트

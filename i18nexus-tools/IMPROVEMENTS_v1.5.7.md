# i18nexus-tools v1.5.7 개선 사항

## 🎯 주요 개선 사항

### 1. 서버 컴포넌트 자동 감지

**문제:** Next.js App Router에서 서버 컴포넌트에 `useTranslation()` 훅을 추가하면 에러 발생

**해결:** `getServerTranslation` 호출을 감지하여 서버 컴포넌트에는 `useTranslation` 훅을 추가하지 않음

#### Before

```tsx
// 서버 컴포넌트
export default async function ServerPage() {
  const { t } = await getServerTranslation();

  // ❌ useTranslation() 훅이 추가되어 에러 발생
  return <h1>{t("서버 렌더링")}</h1>;
}
```

#### After

```tsx
// 서버 컴포넌트
export default async function ServerPage() {
  const { t } = await getServerTranslation();

  // ✅ useTranslation() 훅이 추가되지 않음
  return <h1>{t("서버 렌더링")}</h1>;
}
```

**로그 출력:**

```
🔵 Server component detected - skipping useTranslation hook
```

---

### 2. 컨텍스트 기반 데이터 소스 추적

**문제:** 모든 `item.label` 형태의 코드를 무차별적으로 `t()` 래핑하여 API 데이터까지 래핑됨

**해결:** 데이터의 출처를 추적하여 정적 상수에서 온 데이터만 처리

#### Before

```tsx
// API 데이터
const [users, setUsers] = useState([]);

function UserList() {
  // ❌ API 데이터인데도 래핑됨
  return users.map((user) => <div>{t(user.name)}</div>);
}
```

#### After

```tsx
// API 데이터
const [users, setUsers] = useState([]);

function UserList() {
  // ✅ API 데이터는 래핑 안됨
  return users.map((user) => <div>{user.name}</div>);
}
```

**로그 출력:**

```
🔍 Analyzing binding for user
🔍 Found array method: users.map()
📋 Source array users has props: none
❌ users not analyzed and not matching heuristic
```

---

### 3. API 데이터 패턴 감지

**자동으로 제외되는 패턴:**

#### useState/useEffect

```tsx
const [apiData, setApiData] = useState([]);

useEffect(() => {
  fetch("/api/data").then((data) => setApiData(data));
}, []);

// ✅ apiData는 자동으로 제외됨
{
  apiData.map((item) => <div>{item.label}</div>);
}
```

#### React 훅

```tsx
const { data } = useQuery("/api/users");
const memoizedData = useMemo(() => processData(), []);
const [state, setState] = useState([]);

// ✅ 모두 자동으로 제외됨
```

#### let/var 변수

```tsx
let dynamicItems = [...];
var mutableData = [...];

// ✅ const가 아닌 변수는 자동으로 제외됨
```

#### 배열 구조 분해

```tsx
const [data, setData] = useState();
const [items, setItems] = useState([]);

// ✅ 구조 분해 할당은 자동으로 제외됨
```

---

### 4. Props와 파라미터 감지 강화

**Props 감지 (일반 + Destructuring):**

```tsx
// 일반 Props
function Component(props: Props) {
  // ✅ props.items는 자동으로 제외됨
  return props.items.map((item) => <div>{item.label}</div>);
}

// Destructured Props
function Component({ items }: Props) {
  // ✅ items는 자동으로 제외됨
  return items.map((item) => <div>{item.label}</div>);
}

// 객체 구조 분해 Props
function Component({ items, title }: { items: Item[]; title: string }) {
  // ✅ items와 title은 자동으로 제외됨
  return <h1>{title}</h1>;
}
```

**배열 메서드 콜백 파라미터는 정상 처리:**

```tsx
const NAV_ITEMS = [{ path: "/home", label: "홈" }];

// ✅ item은 배열 메서드의 콜백이므로 props가 아님 - 정상 처리됨
NAV_ITEMS.map((item) => <div>{t(item.label)}</div>);
```

---

## 📊 처리/제외 매트릭스

| 데이터 소스          | 처리 여부 | 예시                                   |
| -------------------- | --------- | -------------------------------------- |
| `const` 정적 상수    | ✅ 처리   | `const NAV_ITEMS = [...]`              |
| 외부 import된 상수   | ✅ 처리   | `import { ITEMS } from './constants'`  |
| ALL_CAPS 패턴        | ✅ 처리   | `USER_CONFIG`, `API_ENDPOINTS`         |
| PascalCase 패턴      | ✅ 처리   | `ButtonConfig`, `NavItems`             |
| useState 데이터      | ❌ 제외   | `const [data, setData] = useState()`   |
| useEffect 데이터     | ❌ 제외   | `useEffect(() => fetch(...))`          |
| fetch/axios          | ❌ 제외   | `fetch('/api/users')`                  |
| useQuery/useMutation | ❌ 제외   | `const { data } = useQuery()`          |
| Props (일반)         | ❌ 제외   | `function Component(props)`            |
| Props (destructured) | ❌ 제외   | `function Component({ items })`        |
| 함수 파라미터        | ❌ 제외   | `function handler(data)`               |
| let/var 변수         | ❌ 제외   | `let items = [...]`                    |
| 배열 메서드 콜백     | ✅ 처리   | `.map(item => ...)` (상수 배열인 경우) |

---

## 🔧 기술적 세부 사항

### 새로운 메서드

#### `isServerComponent(path: NodePath<t.Function>): boolean`

- 함수 body에서 `getServerTranslation` 호출 감지
- `await getServerTranslation()` 패턴도 감지
- 서버 컴포넌트 여부를 반환

#### `processFunctionBody()` 반환 타입 변경

```typescript
// Before
processFunctionBody(): boolean

// After
processFunctionBody(): { wasModified: boolean; isServerComponent: boolean }
```

#### `isFromPropsOrParams()` 강화

- 객체 destructuring props 감지 추가
- `function Component({ items })` 패턴 지원
- `flatMap` 배열 메서드 추가

### 개선된 상수 분석

**1 depth 분석:**

```typescript
const NAV_ITEMS = [
  { path: "/home", label: "홈" }, // ✅ 1 depth - 분석됨
];

const NESTED = [
  {
    item: {
      nested: { label: "중첩" }, // ❌ 2+ depth - 분석 안됨
    },
  },
];
```

**렌더링 가능한 속성 키워드:**

- `label`, `title`, `text`, `name`
- `placeholder`, `description`, `content`
- `message`, `tooltip`, `hint`
- `caption`, `subtitle`, `heading`

---

## 📝 사용 예시

### 예시 1: 정적 상수 vs API 데이터

```tsx
// ✅ 정적 상수 - 처리됨
const NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/about", label: "소개" },
];

function Navigation() {
  return NAV_ITEMS.map((item) => (
    <a href={item.path}>{t(item.label)}</a> // ✅ 자동 래핑
  ));
}

// ❌ API 데이터 - 제외됨
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users").then((data) => setUsers(data));
  }, []);

  return users.map((user) => (
    <div>{user.name}</div> // ✅ 래핑 안됨
  ));
}
```

### 예시 2: 서버 vs 클라이언트 컴포넌트

```tsx
// 서버 컴포넌트
export default async function ServerPage() {
  const { t } = await getServerTranslation();
  // ✅ useTranslation() 추가 안됨

  return <h1>{t("서버 렌더링")}</h1>;
}

// 클라이언트 컴포넌트
("use client");
export default function ClientPage() {
  const { t } = useTranslation(); // ✅ 자동으로 추가됨

  return <h1>{t("클라이언트 렌더링")}</h1>;
}
```

### 예시 3: Props vs 로컬 상수

```tsx
const LOCAL_ITEMS = [{ id: 1, label: "로컬" }];

function Component({ items }: Props) {
  return (
    <div>
      {/* ❌ Props - 래핑 안됨 */}
      {items.map((item) => (
        <div>{item.label}</div>
      ))}

      {/* ✅ 로컬 상수 - 래핑됨 */}
      {LOCAL_ITEMS.map((item) => (
        <div>{t(item.label)}</div>
      ))}
    </div>
  );
}
```

---

## 🚀 업그레이드 가이드

### 1. 패키지 업데이트

```bash
npm install -g i18nexus-tools@latest
# 또는
npm install -D i18nexus-tools@latest
```

### 2. 기존 프로젝트 재처리 (선택사항)

이전 버전으로 처리된 코드가 있다면:

```bash
# 백업 생성
cp -r src src.backup

# 새 버전으로 재처리
i18n-wrapper --dry-run  # 먼저 미리보기
i18n-wrapper            # 실제 적용
```

### 3. 설정 파일 (필요시)

`constantPatterns` 옵션으로 상수 인식 패턴 커스터마이즈:

```json
{
  "constantPatterns": ["_ITEMS", "_CONFIG", "_MENU", "UI_"],
  "sourcePattern": "src/**/*.{ts,tsx}",
  "translationImportSource": "i18nexus"
}
```

---

## 🎉 기대 효과

### Before (v1.5.6 이하)

- ❌ API 데이터까지 무차별 래핑
- ❌ Props 데이터 래핑으로 인한 오류
- ❌ 서버 컴포넌트에 useTranslation 추가로 에러
- ❌ 많은 수동 정리 작업 필요

### After (v1.5.7)

- ✅ 정적 상수만 정확하게 래핑
- ✅ API/동적 데이터 자동 제외
- ✅ Props/파라미터 자동 제외
- ✅ 서버 컴포넌트 자동 감지
- ✅ 거의 수동 정리 불필요
- ✅ 더 안전하고 정확한 자동화

---

## 🔗 관련 링크

- [README.md](./README.md) - 전체 사용 가이드
- [CHANGELOG.md](./CHANGELOG.md) - 전체 변경 내역
- [GitHub Issues](https://github.com/yourusername/i18nexus-tools/issues) - 버그 리포트 및 기능 제안

---

## 📞 문의 및 지원

문제가 발생하거나 개선 제안이 있으시면:

- GitHub Issues에 등록해주세요
- README의 사용 예시를 참고하세요
- `--dry-run` 옵션으로 먼저 미리보기하세요

---

**v1.5.7** - 2025-01-26

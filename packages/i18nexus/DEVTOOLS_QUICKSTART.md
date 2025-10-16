# 🚀 I18NexusDevtools - Quick Start

## 1분 안에 시작하기

### 1️⃣ 설치 (이미 i18nexus를 사용 중이라면 스킵)

```bash
npm install i18nexus
```

### 2️⃣ 앱에 추가하기

```tsx
import { I18nProvider, I18NexusDevtools } from "i18nexus";

function App() {
  return (
    <I18nProvider
      languageManagerOptions={{
        supportedLanguages: [
          { code: "en", name: "English" },
          { code: "ko", name: "한국어" },
        ],
        defaultLanguage: "en",
      }}
      translations={{
        en: { greeting: "Hello" },
        ko: { greeting: "안녕하세요" },
      }}>
      <YourApp />

      {/* 👇 이 한 줄만 추가하면 끝! */}
      <I18NexusDevtools />
    </I18nProvider>
  );
}
```

### 3️⃣ 개발 서버 실행

```bash
npm run dev
```

### 4️⃣ 확인하기

- 화면 좌측 하단에 🌐 **i18nexus** 버튼이 보입니다
- 클릭하면 개발자 도구 패널이 열립니다!

---

## 🎮 사용 방법

### 언어 전환하기

1. 패널 열기 (좌측 하단 버튼 클릭)
2. "Available Languages" 섹션에서 원하는 언어 클릭
3. 즉시 언어가 전환됩니다!

### 브라우저 언어로 전환

- "Browser Language" 섹션의 **Switch** 버튼 클릭

### 기본 언어로 리셋

- "Actions" 섹션의 **Reset to Default Language** 버튼 클릭

### 패널 닫기

- ✕ 버튼 클릭 또는
- **ESC** 키 누르기

---

## 🎨 커스터마이징

### 위치 변경

```tsx
<I18NexusDevtools position="bottom-right" />
```

### 처음부터 열기

```tsx
<I18NexusDevtools initialIsOpen={true} />
```

### 스타일 변경

```tsx
<I18NexusDevtools
  panelStyles={{
    width: "500px",
    backgroundColor: "#1a1a1a",
  }}
  buttonStyles={{
    backgroundColor: "#10b981",
    borderRadius: "50%",
  }}
/>
```

---

## ❓ FAQ

### Q: Production에도 표시되나요?

**A:** 아니요! `NODE_ENV === 'production'`일 때 자동으로 제거됩니다.

### Q: 번들 크기에 영향이 있나요?

**A:** Production 빌드에서 완전히 제거되므로 영향 없습니다.

### Q: Next.js App Router에서도 작동하나요?

**A:** 네! 클라이언트 컴포넌트로 완벽하게 작동합니다.

### Q: TypeScript 타입이 제공되나요?

**A:** 네! 모든 Props에 대한 완전한 타입이 제공됩니다.

---

## 🎉 완료!

이제 React Query처럼 우아한 i18n 개발자 도구를 사용할 수 있습니다!

더 자세한 내용은 [DEVTOOLS.md](./DEVTOOLS.md)를 참조하세요.

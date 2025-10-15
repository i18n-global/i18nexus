# i18nexus

<div align="center">

![i18nexus Logo](https://img.shields.io/badge/i18nexus-Complete%20React%20i18n%20Toolkit-blue?style=for-the-badge)

[![npm version](https://badge.fury.io/js/i18nexus.svg)](https://badge.fury.io/js/i18nexus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**🌍 Type-safe React i18n toolkit with intelligent automation and Server Components support**

[Features](#-features) • [Quick Start](#-quick-start) • [Type Safety](#-type-safe-languages) • [Server Components](#-server-components) • [CLI Tools](#-cli-tools)

</div>

---

## 🚀 What is i18nexus?

i18nexus is a comprehensive React internationalization toolkit that **automates the entire i18n workflow** with **full type safety**. With TypeScript config support, automatic string wrapping, and seamless Google Sheets integration, i18nexus eliminates tedious manual work while providing IDE autocomplete for language codes.

### ✨ Why i18nexus?

- **🎯 Type-Safe Languages**: TypeScript config with autocomplete for language codes
- **🤖 Zero Manual Work**: Automatically detect and wrap hardcoded strings
- **🖥️ Server Components**: Full Next.js App Router support with zero hydration issues
- **🔄 3-Command Setup**: `init` → `wrapper` → `extractor` - Done!
- **🍪 Smart Persistence**: Cookie-based language management with SSR support
- **📊 Team Collaboration**: Direct Google Sheets integration for translators

---

## 🌟 Features

### 🎯 Type-Safe Language Management (NEW!)

With TypeScript config support, get **IDE autocomplete** and **compile-time validation** for language codes:

```typescript
// i18nexus.config.ts
import { defineConfig } from "i18nexus";

export const config = defineConfig({
  languages: ["en", "ko", "ja"] as const, // Type inference!
  defaultLanguage: "ko",
  localesDir: "./locales",
  sourcePattern: "app/**/*.{ts,tsx}",
  translationImportSource: "i18nexus",
});

export type AppLanguages = (typeof config.languages)[number];
```

```typescript
// In your component
const { changeLanguage } = useLanguageSwitcher<AppLanguages>();

changeLanguage("en"); // ✅ Autocomplete!
changeLanguage("ko"); // ✅ Type-safe!
changeLanguage("fr"); // ❌ Compile error!
```

### 🖥️ Server & Client Components Support

- **Server Components**: Use `createServerTranslation()` for optimal performance
- **Client Components**: Use `useTranslation()` hook for dynamic interactions
- **Zero Hydration Mismatch**: Server and client always in sync
- **Automatic Cookie Reading**: Language persists across page reloads

### 🔧 Smart Code Transformation

- **Automatic Detection**: Finds hardcoded Korean and English strings in JSX
- **Intelligent Wrapping**: Wraps strings with `t()` functions automatically
- **Import Management**: Adds necessary imports where needed
- **TypeScript Support**: Full TypeScript compatibility

### 🔍 Translation Key Extraction

- **Comprehensive Scanning**: Extracts all `t()` wrapped keys from your codebase
- **Smart Merging**: Preserves existing translations, only adds new keys
- **Multi-language Support**: Generate files for all your languages
- **Config-based**: Use `i18nexus.config.ts` or `.json` for project settings

### 📊 Google Sheets Integration

- **Direct Sync**: Upload/download translations to/from Google Sheets
- **Real-time Collaboration**: Translators work directly in familiar interface
- **Version Control**: Track translation changes and updates
- **Batch Operations**: Handle multiple languages simultaneously

---

## 🚀 Quick Start

### Installation

```bash
npm install i18nexus
```

### 1. Initialize Project (with TypeScript Config)

```bash
npx i18n-sheets init --typescript
```

This creates:
- `i18nexus.config.ts` - TypeScript configuration with type inference
- `locales/` directory - Translation files (ko.json, en.json)

Or use JSON config (without type safety):

```bash
npx i18n-sheets init
```

### 2. Setup I18nProvider (Next.js App Router)

```tsx
// app/layout.tsx
import { I18nProvider } from "i18nexus";
import { cookies } from "next/headers";
import { config, AppLanguages } from "@/i18nexus.config";
import enTranslations from "@/locales/en.json";
import koTranslations from "@/locales/ko.json";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const language = cookieStore.get("i18n-language")?.value || config.defaultLanguage;

  return (
    <html lang={language}>
      <body>
        <I18nProvider<AppLanguages>
          initialLanguage={language as AppLanguages}
          languageManagerOptions={{
            defaultLanguage: config.defaultLanguage,
            availableLanguages: [
              { code: "ko", name: "한국어", flag: "🇰🇷" },
              { code: "en", name: "English", flag: "🇺🇸" },
            ],
          }}
          translations={{
            ko: koTranslations,
            en: enTranslations,
          }}
        >
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 3. Wrap Korean Text

```bash
npx i18n-wrapper
```

**What it does:**
- ✅ Detects Korean text in your components
- ✅ Wraps with `t()` functions
- ✅ Adds `useTranslation` imports
- ✅ Adds hooks to components

**⚠️ Important**: Check for Server Components after running this. Add `'use client'` directive or use server utilities as needed.

### 4. Extract Translation Keys

```bash
npx i18n-extractor
```

This will create/update:
- `locales/ko.json` - Korean translations (auto-filled)
- `locales/en.json` - English translations (needs manual translation)

### 5. Add English Translations

Open `locales/en.json` and add English translations:

```json
{
  "안녕하세요": "Hello",
  "환영합니다": "Welcome"
}
```

**Done!** 🎉

---

## 🎯 Type-Safe Languages

### Why Type Safety?

With TypeScript config, you get:
- ✅ **Autocomplete** in IDE for language codes
- ✅ **Compile-time errors** for invalid languages
- ✅ **Refactoring support** when adding/removing languages
- ✅ **Self-documenting code** with explicit types

### Setup

1. **Create TypeScript config:**

```bash
npx i18n-sheets init --typescript
```

2. **Use typed hooks:**

```typescript
import { useLanguageSwitcher } from "i18nexus";
import { AppLanguages } from "@/i18nexus.config";

function LanguageSwitcher() {
  const { changeLanguage } = useLanguageSwitcher<AppLanguages>();
  
  // IDE will autocomplete: "en" | "ko" | "ja"
  return (
    <div>
      <button onClick={() => changeLanguage("en")}>English</button>
      <button onClick={() => changeLanguage("ko")}>한국어</button>
    </div>
  );
}
```

3. **Customize import source:**

In `i18nexus.config.ts`:

```typescript
export const config = defineConfig({
  // ...
  translationImportSource: "@/lib/i18n", // Custom import path
});
```

Then `i18n-wrapper` will use this import:

```typescript
import { useTranslation } from "@/lib/i18n"; // Your custom path!
```

### Migration from JSON

Already have `i18nexus.config.json`? Easy migration:

```typescript
// Before: i18nexus.config.json
{
  "languages": ["en", "ko"],
  "defaultLanguage": "en"
}

// After: i18nexus.config.ts
import { defineConfig } from "i18nexus";

export const config = defineConfig({
  languages: ["en", "ko"] as const, // Add 'as const'
  defaultLanguage: "en",
  localesDir: "./locales",
  sourcePattern: "app/**/*.{ts,tsx}",
  translationImportSource: "i18nexus",
});

export type AppLanguages = (typeof config.languages)[number];
```

See [TYPED_CONFIG.md](./TYPED_CONFIG.md) for detailed guide.

---

## 🖥️ Server Components

i18nexus provides full support for Next.js Server Components.

### Why Use Server Components?

- ✅ **Smaller JavaScript bundle** - No React Context or hooks sent to client
- ✅ **Faster initial load** - Translations rendered on server
- ✅ **Better SEO** - Fully rendered HTML with correct language
- ✅ **Zero hydration mismatch** - Server and client always in sync

### Server Component Usage

```tsx
// app/page.tsx (Server Component - no "use client")
import { cookies } from "next/headers";
import { createServerI18n } from "i18nexus/server";
import { translations } from "@/lib/i18n";

export default async function Page() {
  const cookieStore = await cookies();
  const { language, t } = await createServerI18n({
    cookieStore,
    translations,
  });

  return (
    <div>
      <h1>{t("Welcome")}</h1>
      <p>{t("This is a server component")}</p>
    </div>
  );
}
```

### Client Component Usage

```tsx
// app/components/LanguageSwitcher.tsx
"use client";

import { useTranslation, useLanguageSwitcher } from "i18nexus";
import { AppLanguages } from "@/i18nexus.config";

export default function LanguageSwitcher() {
  const { t } = useTranslation<AppLanguages>();
  const { currentLanguage, changeLanguage, availableLanguages } =
    useLanguageSwitcher<AppLanguages>();

  return (
    <div>
      <p>{t("Current Language")}: {currentLanguage}</p>
      {availableLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={currentLanguage === lang.code ? "active" : ""}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
}
```

### Comparison

| Feature            | Server Components           | Client Components  |
| ------------------ | --------------------------- | ------------------ |
| Bundle Size        | ✅ Smaller                  | ⚠️ Larger          |
| Performance        | ✅ Faster                   | ⚠️ Slower          |
| Language Switching | ❌ Requires reload          | ✅ Dynamic         |
| Interactivity      | ❌ Static                   | ✅ Full            |
| Usage              | `createServerI18n()`        | `useTranslation()` |
| Directive          | None                        | `"use client"`     |

---

## 🛠️ CLI Tools

### npx i18n-sheets init

Initialize i18nexus project.

```bash
# With TypeScript config (recommended)
npx i18n-sheets init --typescript

# With JSON config
npx i18n-sheets init
```

### npx i18n-wrapper

Automatically wrap hardcoded strings.

```bash
# Basic usage (uses config)
npx i18n-wrapper

# Custom pattern
npx i18n-wrapper -p "app/**/*.tsx"

# Preview changes
npx i18n-wrapper --dry-run
```

**Configuration**: Set `translationImportSource` in your config to customize imports.

### npx i18n-extractor

Extract translation keys.

```bash
# Basic usage (uses config)
npx i18n-extractor

# Custom pattern
npx i18n-extractor -p "app/**/*.tsx"

# Preview
npx i18n-extractor --dry-run
```

### npx i18n-sheets upload/download

Sync with Google Sheets.

```bash
# Upload
npx i18n-sheets upload -s YOUR_SPREADSHEET_ID

# Download
npx i18n-sheets download -s YOUR_SPREADSHEET_ID
```

### Complete Workflow

```bash
# 1. Initialize with TypeScript config
npx i18n-sheets init --typescript

# 2. Setup I18nProvider in layout.tsx
# (See Quick Start section)

# 3. Wrap Korean text
npx i18n-wrapper

# 4. Check and fix Server Components
# (Add 'use client' or use createServerI18n)

# 5. Extract keys
npx i18n-extractor

# 6. Add English translations in locales/en.json

# 7. (Optional) Sync with Google Sheets
npx i18n-sheets upload -s YOUR_SPREADSHEET_ID
```

---

## 📖 API Reference

### I18nProvider Props

```tsx
interface I18nProviderProps<TLanguage extends string = string> {
  children: ReactNode;
  languageManagerOptions?: LanguageManagerOptions;
  translations?: Record<string, Record<string, string>>;
  onLanguageChange?: (language: TLanguage) => void;
  initialLanguage?: TLanguage;
}

interface LanguageManagerOptions {
  defaultLanguage?: string;
  availableLanguages?: LanguageConfig[];
  cookieName?: string;
  cookieOptions?: CookieOptions;
}

interface LanguageConfig {
  code: string;
  name: string;
  flag?: string;
  dir?: "ltr" | "rtl";
}
```

### Server-side Utilities

```tsx
import { createServerI18n } from "i18nexus/server";

// All-in-one server i18n setup
const { language, t, translations } = await createServerI18n({
  cookieStore?: ReadonlyRequestCookies;
  localesDir?: string;
  cookieName?: string;
  defaultLanguage?: string;
  translations?: Record<string, Record<string, string>>;
});
```

### Client Hooks

```tsx
// Translation hook with type safety
const { t, currentLanguage, isReady } = 
  useTranslation<AppLanguages>();

// Language switcher hook with type safety
const {
  currentLanguage,
  availableLanguages,
  changeLanguage,
  switchToNextLanguage,
  switchToPreviousLanguage,
  isLoading,
} = useLanguageSwitcher<AppLanguages>();
```

### Config Utilities

```tsx
import { defineConfig, type ExtractLanguages } from "i18nexus";

// Define typed config
const config = defineConfig({
  languages: ["en", "ko"] as const,
  // ...
});

// Extract language type
type Languages = ExtractLanguages<typeof config>;
```

---

## 📊 Google Sheets Setup

### 1. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Sheets API
4. Create Service Account
5. Download JSON credentials

### 2. Setup Google Sheet

1. Create a new Google Spreadsheet
2. Share it with your service account email
3. Copy the spreadsheet ID from URL

### 3. Use with CLI

```bash
npx i18n-sheets upload -s YOUR_SPREADSHEET_ID -c ./credentials.json
```

---

## 📁 Project Structure

```
your-project/
├── app/
│   ├── layout.tsx              # I18nProvider setup
│   ├── page.tsx                # Server or Client Component
│   └── components/
│       └── LanguageSwitcher.tsx # Client Component
├── locales/
│   ├── en.json                 # English translations
│   └── ko.json                 # Korean translations
├── i18nexus.config.ts          # TypeScript configuration
└── credentials.json            # Google Sheets credentials (optional)
```

---

## 🎓 Documentation

- 📖 [QUICK_START.md](./QUICK_START.md) - Quick start guide
- 🎯 [TYPED_CONFIG.md](./TYPED_CONFIG.md) - Type-safe configuration guide
- 📊 [Google Sheets Guide](./docs/google-sheets.md)
- 🖥️ [Server Components Guide](./docs/server-components.md)

---

## 🤝 Contributing

We welcome contributions! Please check out our [GitHub repository](https://github.com/manNomi/i18nexus).

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the React community**

[⭐ Star us on GitHub](https://github.com/manNomi/i18nexus) • [🐛 Report Issues](https://github.com/manNomi/i18nexus/issues)

</div>

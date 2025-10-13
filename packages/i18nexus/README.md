# i18nexus

<div align="center">

![i18nexus Logo](https://img.shields.io/badge/i18nexus-Complete%20React%20i18n%20Toolkit-blue?style=for-the-badge)

[![npm version](https://badge.fury.io/js/i18nexus.svg)](https://badge.fury.io/js/i18nexus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**🌍 Complete React i18n toolkit with intelligent automation and Server Components support**

[Features](#-features) • [Quick Start](#-quick-start) • [Server Components](#-server-components) • [CLI Tools](#-cli-tools) • [API](#-api)

</div>

---

## 🚀 What is i18nexus?

i18nexus is a comprehensive React internationalization toolkit that **automates the entire i18n workflow**. With full Next.js App Router support (including Server Components), automatic string wrapping, and seamless Google Sheets integration, i18nexus eliminates the tedious manual work of internationalization.

### ✨ Why i18nexus?

- **🤖 Zero Manual Work**: Automatically detect and wrap hardcoded strings
- **🖥️ Server Components**: Full Next.js App Router support with zero hydration issues
- **🔄 Seamless Workflow**: Init → Wrap → Extract → Translate in minutes
- **🍪 Smart Persistence**: Cookie-based language management with SSR support
- **📊 Team Collaboration**: Direct Google Sheets integration for translators
- **🎯 Developer Friendly**: CLI tools that integrate into any workflow

---

## 🌟 Features

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
- **Config-based**: Use `i18nexus.config.json` for project settings

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

### 1. Initialize Project

```bash
npx i18n-sheets init
```

This creates:

- `i18nexus.config.json` - Project configuration
- `locales/` directory - Translation files (ko.json, en.json)

### 2. Setup I18nProvider (Next.js App Router)

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import { I18nProvider } from "i18nexus";
import { getServerLanguage } from "i18nexus/server";
import { translations } from "@/lib/i18n";

export default async function RootLayout({ children }) {
  // Read language from cookies on the server
  const headersList = await headers();
  const language = getServerLanguage(headersList);

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

```tsx
// lib/i18n.ts
import en from "../locales/en.json";
import ko from "../locales/ko.json";

export const translations = {
  en,
  ko,
};
```

### 3. Wrap Korean Text

```bash
npx i18n-wrapper
```

**⚠️ Important: Check for Server Components**

After running `i18n-wrapper`, some files may have errors because:

1. If the file is a Server Component (no `'use client'`), you need to use server utilities
2. Check the error and decide whether to:
   - Add `'use client'` directive
   - Use `createServerTranslation()` for Server Components

### 4. Extract Translation Keys

```bash
# For Next.js App Router
npx i18n-extractor -p "app/**/*.tsx"

# For src/ directory
npx i18n-extractor -p "src/**/*.tsx"
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

---

## 🖥️ Server Components

i18nexus provides full support for Next.js Server Components with dedicated utilities.

### Why Use Server Components?

- ✅ **Smaller JavaScript bundle** - No React Context or hooks sent to client
- ✅ **Faster initial load** - Translations rendered on server
- ✅ **Better SEO** - Fully rendered HTML with correct language
- ✅ **Zero hydration mismatch** - Server and client always in sync

### Server Component Usage

```tsx
// app/page.tsx (Server Component - no "use client")
import { headers } from "next/headers";
import { getServerLanguage, createServerTranslation } from "i18nexus/server";
import { translations } from "@/lib/i18n";

export default async function Page() {
  const headersList = await headers();
  const language = getServerLanguage(headersList);
  const t = createServerTranslation(language, translations);

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

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages } =
    useLanguageSwitcher();

  return (
    <div>
      <p>
        {t("Current Language")}: {currentLanguage}
      </p>
      {availableLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={currentLanguage === lang.code ? "active" : ""}>
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
| Usage              | `createServerTranslation()` | `useTranslation()` |
| Directive          | None                        | `"use client"`     |

---

## 🛠️ CLI Tools

### npx i18n-sheets init

Initialize i18nexus project with configuration and translation files.

```bash
npx i18n-sheets init
```

Creates:

- `i18nexus.config.json`
- `locales/ko.json`
- `locales/en.json`

### npx i18n-wrapper

Automatically wrap hardcoded Korean strings with `t()` functions.

```bash
# Basic usage
npx i18n-wrapper

# Custom pattern
npx i18n-wrapper -p "app/**/*.tsx"
```

**What it does:**

- Detects Korean text in JSX
- Wraps with `t()`
- Adds imports if needed

### npx i18n-extractor

Extract translation keys from your code.

```bash
# For App Router
npx i18n-extractor -p "app/**/*.tsx"

# For src directory
npx i18n-extractor -p "src/**/*.tsx"
```

**Features:**

- Smart merging (preserves existing translations)
- Adds only new keys
- Sorts keys alphabetically

### npx i18n-sheets upload

Upload translations to Google Sheets.

```bash
npx i18n-sheets upload -s YOUR_SPREADSHEET_ID
```

### npx i18n-sheets download

Download translations from Google Sheets.

```bash
npx i18n-sheets download -s YOUR_SPREADSHEET_ID
```

### Complete Workflow

```bash
# 1. Initialize project
npx i18n-sheets init

# 2. Setup I18nProvider in layout.tsx
# (See Quick Start section)

# 3. Wrap Korean text
npx i18n-wrapper -p "app/**/*.tsx"

# 4. Check and fix Server Components
# (Add 'use client' or use createServerTranslation)

# 5. Extract keys
npx i18n-extractor -p "app/**/*.tsx"

# 6. Add English translations in locales/en.json

# 7. (Optional) Sync with Google Sheets
npx i18n-sheets upload -s YOUR_SPREADSHEET_ID
```

---

## 📖 API Reference

### I18nProvider Props

```tsx
interface I18nProviderProps {
  children: ReactNode;
  languageManagerOptions?: LanguageManagerOptions;
  translations?: Record<string, Record<string, string>>;
  onLanguageChange?: (language: string) => void;
  initialLanguage?: string; // From getServerLanguage()
}

interface LanguageManagerOptions {
  defaultLanguage?: string; // default: 'en'
  availableLanguages?: LanguageConfig[];
  cookieName?: string; // default: 'i18n-language'
  cookieOptions?: CookieOptions;
}

interface LanguageConfig {
  code: string;
  name: string;
  flag?: string;
  direction?: "ltr" | "rtl";
}
```

### Server-side Utilities

```tsx
import {
  getServerLanguage,
  createServerTranslation,
  getServerTranslations
} from "i18nexus/server";

// Get language from cookies
const language = getServerLanguage(headers, {
  cookieName?: string;      // default: 'i18n-language'
  defaultLanguage?: string; // default: 'en'
});

// Create translation function
const t = createServerTranslation(language, translations);

// Get raw translations object
const dict = getServerTranslations(language, translations);
```

### Client Hooks

```tsx
// Translation hook
const { t, currentLanguage, isReady } = useTranslation();

// Language switcher hook
const {
  currentLanguage,
  availableLanguages,
  changeLanguage,
  switchToNextLanguage,
  switchToPreviousLanguage,
  isLoading,
} = useLanguageSwitcher();
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
│   ├── layout.tsx          # I18nProvider setup
│   ├── page.tsx            # Server or Client Component
│   └── components/
│       └── Header.tsx      # Client Component with useTranslation
├── lib/
│   └── i18n.ts            # Translation exports
├── locales/
│   ├── en.json            # English translations
│   └── ko.json            # Korean translations
├── i18nexus.config.json   # i18nexus configuration
└── credentials.json       # Google Sheets credentials (optional)
```

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

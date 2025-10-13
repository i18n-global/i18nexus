# Changelog

All notable changes to i18nexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-01-14

### 🎉 Major Features

#### Server Components Support

- **NEW**: Full Next.js App Router Server Components support
- **NEW**: `createServerTranslation()` function for server-side translations
- **NEW**: `getServerTranslations()` function to get raw translation object
- **NEW**: `getServerLanguage()` improved with better type safety
- **NEW**: Separate package export `i18nexus/server` for server utilities

#### CLI Improvements

- **NEW**: `config-loader.ts` - Centralized configuration management
- **NEW**: `i18nexus.config.json` support for project-wide settings
- **NEW**: `i18n-sheets init` command to initialize projects
- **IMPROVED**: `i18n-extractor` now supports config-based settings
- **IMPROVED**: `i18n-wrapper` now supports config-based settings
- **IMPROVED**: `i18n-sheets` commands now read from config file

#### Demo Application

- **NEW**: `/getting-started` page with complete step-by-step guide
- **NEW**: `/server-example` page demonstrating Server Component usage
- **NEW**: Comprehensive examples for both Client and Server Components
- **NEW**: Warning sections for common pitfalls

### ✨ Enhancements

- **IMPROVED**: README with Server Components documentation
- **IMPROVED**: Better TypeScript type definitions for server utilities
- **IMPROVED**: More comprehensive error messages in CLI tools
- **IMPROVED**: Demo app now shows best practices for Next.js App Router

### 📝 Documentation

- Complete rewrite of README with Server Components focus
- Added migration guide from Client to Server Components
- Added comparison table for Server vs Client Components
- Added complete workflow examples

### 🐛 Bug Fixes

- Fixed TypeScript build errors in `tsconfig.build.json`
- Fixed hydration mismatch issues in Next.js App Router
- Fixed import resolution for server utilities

### ⚠️ Breaking Changes

None - This is a backwards compatible release

### 📦 Dependencies

- Synced bin scripts with latest i18nexus-tools
- Updated scripts to use centralized config loader

## [2.0.6] - 2024-12-XX

### Initial Release

- Basic I18nProvider with cookie-based language management
- useTranslation and useLanguageSwitcher hooks
- CLI tools: i18n-wrapper, i18n-extractor, i18n-upload, i18n-download
- Google Sheets integration
- TypeScript support
- Next.js compatibility

---

## Migration Guide

### Migrating to 2.1.0

If you're using Server Components in Next.js App Router:

#### Before (2.0.6)

```tsx
// ❌ This causes hydration issues
export default function Layout({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
```

#### After (2.1.0)

```tsx
// ✅ Server-side language detection
import { headers } from "next/headers";
import { getServerLanguage } from "i18nexus/server";

export default async function Layout({ children }) {
  const headersList = await headers();
  const language = getServerLanguage(headersList);

  return <I18nProvider initialLanguage={language}>{children}</I18nProvider>;
}
```

#### Using Server Components

```tsx
// ✅ Server Component with translations
import { createServerTranslation } from "i18nexus/server";

export default async function Page() {
  const t = createServerTranslation(language, translations);
  return <h1>{t("Welcome")}</h1>;
}
```

---

## Roadmap

### Planned for 2.2.0

- [ ] Automatic translation API integration (DeepL, Google Translate)
- [ ] VSCode extension for inline translation editing
- [ ] Advanced caching strategies
- [ ] Translation validation and testing utilities

### Planned for 2.3.0

- [ ] React Native support
- [ ] Pluralization support
- [ ] Gender-specific translations
- [ ] RTL language support improvements

---

[2.1.0]: https://github.com/manNomi/i18nexus/compare/v2.0.6...v2.1.0
[2.0.6]: https://github.com/manNomi/i18nexus/releases/tag/v2.0.6

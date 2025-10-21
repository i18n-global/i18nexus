# Changelog

## [1.5.0] - 2025-01-16

### 🎯 Major Features - Enhanced Translation Management

#### Improved i18n-upload and i18n-download

- **NEW**: `i18n-upload` now reads configuration from `i18nexus.config.json`
- **NEW**: `i18n-download` now reads configuration from `i18nexus.config.json`
- **NEW**: `i18n-download-force` command for force overwriting translations
- **IMPROVED**: Both commands now work with `locales/en.json` and `locales/ko.json` format
- **IMPROVED**: `i18n-download` now performs incremental updates (only adds new keys)
- **IMPROVED**: Better file structure compatibility with modern i18n setups

#### Smart Translation Syncing

- **NEW**: Incremental download mode (default) - preserves existing translations
- **NEW**: Force download mode (`i18n-download-force`) - overwrites all translations
- **IMPROVED**: More efficient file operations
- **IMPROVED**: Better conflict resolution

### ✨ Enhancements

#### File Structure

- **CHANGED**: Translation files now saved as `locales/en.json`, `locales/ko.json` instead of nested structure
- **IMPROVED**: Simpler file structure for better compatibility
- **IMPROVED**: Automatic directory creation if not exists

#### CLI Tools

- **IMPROVED**: Better error messages for config reading
- **IMPROVED**: Helpful usage instructions in all commands
- **IMPROVED**: Consistent behavior across upload/download commands

### 📝 Documentation

- **IMPROVED**: README with new upload/download commands
- **NEW**: Usage examples for incremental vs force download
- **NEW**: Clear distinction between `i18n-download` and `i18n-download-force`

### 🔧 Configuration

All commands now automatically read from `i18nexus.config.json`:

```json
{
  "languages": ["en", "ko"],
  "localesDir": "./locales",
  "googleSheets": {
    "spreadsheetId": "your-spreadsheet-id",
    "credentialsPath": "./credentials.json",
    "sheetName": "Translations"
  }
}
```

## [1.4.0] - 2025-01-15

# Changelog

## [1.5.2] - 2025-01-21

### 🎯 Feature - Auto-translation for Google Sheets Upload

#### Enhanced i18n-upload Command

- **NEW**: `--auto-translate` flag for `i18n-upload` command
- **NEW**: Automatic GOOGLETRANSLATE formula injection for English translations
- **IMPROVED**: `i18n-download` now uses `FORMATTED_VALUE` to get calculated results from formulas

#### Auto-translation Mode

When using `i18n-upload --auto-translate`:

- Korean translations are uploaded as plain text
- English translations are uploaded as `=GOOGLETRANSLATE(C{row}, "ko", "en")` formulas
- Google Sheets automatically calculates translations in real-time
- Perfect for rapid initial translations of new features

#### Download Improvements

- `i18n-download` now fetches formula results instead of formula strings
- Works seamlessly with both text-based and formula-based uploads
- Ensures consistent text output regardless of upload method

### 📝 Use Cases

**Scenario 1: New Feature Development**

```bash
# Add Korean keys to your code
i18n-wrapper

# Extract Korean translations
i18n-extractor

# Upload with auto-translate for quick English drafts
i18n-upload --auto-translate

# Download translated results
i18n-download
```

**Scenario 2: Manual Translation Workflow**

```bash
# Upload all as text for manual translation
i18n-upload

# Translators work on Google Sheets

# Download finalized translations
i18n-download
```

## [1.5.1] - 2025-10-20

### 🎯 Patch - AST-based constant handling

- **FIX/FEATURE**: `i18n-wrapper` now detects top-level `const` arrays/objects (including those imported from other files) and wraps JSX usages like `{item.label}` with `t(...)` when the underlying constant contains Korean strings (1-depth analysis). This avoids mutating runtime constants and wraps at usage sites.
- **FIX/FEATURE**: `i18n-extractor` can now trace `t(item.prop)` back to constants (internal and external) and extract literal Korean values into `locales/*.json`.
- **IMPROVED**: Excludes dynamic data sources (API, props, useState, function params) from automatic wrapping.
- **NEW**: `constantPatterns` config option to customize variable name heuristics for constants (e.g., uppercase, suffix/prefix matching).

### 🎯 Major Features - Type Safety

#### TypeScript Configuration Support

- **NEW**: `i18nexus.config.ts` support for TypeScript configuration files
- **NEW**: Type inference for language codes with `as const`
- **NEW**: `--typescript` flag for `i18n-sheets init` command
- **NEW**: Auto-detection of config files (`.ts` > `.js` > `.json`)
- **NEW**: `translationImportSource` configuration option

#### Enhanced CLI Tools

- **IMPROVED**: `i18n-wrapper` now respects `translationImportSource` config
- **IMPROVED**: `i18n-sheets init` can generate TypeScript config files
- **IMPROVED**: Better error messages for config file issues
- **IMPROVED**: Async config loading for better performance

#### Custom Import Sources

- **NEW**: `translationImportSource` configuration option
- **NEW**: Customize where `i18n-wrapper` imports from
- **NEW**: Default value: `"i18nexus"`
- **NEW**: Supports custom paths like `"@/lib/i18n"`

### ✨ Enhancements

#### CLI Tools

- **IMPROVED**: Better TypeScript definitions for all tools
- **IMPROVED**: More precise type constraints for generic parameters
- **IMPROVED**: Export config types for reusability

#### Documentation

- **IMPROVED**: README with type safety examples
- **IMPROVED**: Better error messages and help text
- **IMPROVED**: Examples with TypeScript configuration

### 🔧 Breaking Changes

- `loadConfig()` is now async and returns a `Promise`
- Config file priority changed: `.ts` > `.js` > `.json`

### 🐛 Bug Fixes

- Fixed async config loading in bin scripts
- Fixed linter errors related to `any` types
- Fixed type assertions in language switching

### 📦 Dependencies

- No new dependencies added
- All existing dependencies maintained

---

## Recent Updates

### Features Added

#### 1. Enhanced README with App Directory Instructions

- Added comprehensive guide for Next.js App Router (13+) users
- Included specific setup instructions for App Directory vs Pages Directory
- Added side-by-side comparison table
- Provided complete workflow examples for both directory structures

#### 2. Project Initialization Command

- `i18n-sheets init` now creates a complete project setup:
  - `i18nexus.config.json` - Centralized configuration file
  - `locales/en.json` - English translation file (initially empty)
  - `locales/ko.json` - Korean translation file (initially empty)
  - Optional Google Sheets integration setup

#### 3. Configuration Management

- **New config file**: `i18nexus.config.json`
- Supports configuration for:
  - Languages (`languages: ["en", "ko"]`)
  - Default language (`defaultLanguage: "ko"`)
  - Locales directory (`localesDir: "./locales"`)
  - Source file pattern (`sourcePattern: "src/**/*.{js,jsx,ts,tsx}"`)
  - Google Sheets settings (optional)
- All CLI commands now read from config file with command-line overrides

#### 4. Enhanced Extractor Functionality

- **Multi-language support**: Automatically creates/updates translation files for all configured languages
- **Smart merging**: Preserves existing translations while adding new keys
- **Language-specific behavior**:
  - Korean (`ko.json`): Uses the key itself or `defaultValue` as translation
  - English (`en.json`): Empty string for new keys (ready for translation)
  - Other languages: Empty string for new keys (ready for translation)
- Supports custom language lists via `--languages` flag

#### 5. Improved CLI Commands

**i18n-sheets init:**

```bash
# Basic initialization
i18n-sheets init

# With Google Sheets
i18n-sheets init -s <spreadsheet-id> -c ./credentials.json

# Custom languages
i18n-sheets init --languages "en,ko,ja"
```

**i18n-extractor:**

```bash
# Extract to configured languages (from config)
i18n-extractor

# Custom languages
i18n-extractor -l "en,ko,ja,zh"

# Custom pattern (App Directory)
i18n-extractor -p "app/**/*.tsx"
```

**i18n-wrapper:**

```bash
# Use pattern from config
i18n-wrapper

# Override with custom pattern
i18n-wrapper -p "app/**/*.tsx"
```

### Breaking Changes

- Configuration file format changed from `.ts` to `.json` for better compatibility
- Extractor now outputs to `en.json` and `ko.json` by default (instead of single file)
- All commands now read from `i18nexus.config.json` if available

### Migration Guide

#### From Previous Version

1. **Run init command** to create new config structure:

   ```bash
   i18n-sheets init
   ```

2. **Update your config** in `i18nexus.config.json`:

   ```json
   {
     "languages": ["en", "ko"],
     "defaultLanguage": "ko",
     "localesDir": "./locales",
     "sourcePattern": "src/**/*.{js,jsx,ts,tsx}"
   }
   ```

3. **Run extractor** to populate language files:
   ```bash
   i18n-extractor
   ```

#### For Next.js App Directory Users

1. **Initialize project:**

   ```bash
   i18n-sheets init
   ```

2. **Update sourcePattern** in `i18nexus.config.json`:

   ```json
   {
     "sourcePattern": "app/**/*.{js,jsx,ts,tsx}"
   }
   ```

3. **Run the workflow:**
   ```bash
   i18n-wrapper
   i18n-extractor
   ```

### Technical Improvements

- Added TypeScript configuration (`tsconfig.json`)
- Improved build process with proper type checking
- Better error handling and user feedback
- Consistent configuration loading across all commands
- Automatic detection of config file
- Fallback to sensible defaults when config is missing

### Documentation

- Comprehensive README with:
  - Quick start guide
  - App Directory specific instructions
  - Configuration reference
  - CLI command examples
  - Complete workflow guides
- Added inline code documentation
- Improved help text in all commands

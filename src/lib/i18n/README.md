# Quasar Wallet Internationalization (i18n)

This directory contains the internationalization system for Quasar Wallet, supporting multiple languages across the entire application.

## Supported Languages

- 🇺🇸 **English (US)** - Default language
- 🇷🇺 **Russian (Русский)**
- 🇩🇪 **German (Deutsch)**
- 🇫🇷 **French (Français)**

## Usage

### Basic Usage in Components

```tsx
import { useTranslation } from '../lib/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.wallet')}</h1>
      <p>{t('walletSettings.title')}</p>
      <button onClick={() => setLanguage('ru')}>
        Switch to Russian
      </button>
    </div>
  );
}
```

### Using the Language Selector Component

```tsx
import { LanguageSelector } from '../components/LanguageSelector';

function Settings() {
  return (
    <div>
      {/* Full grid layout */}
      <LanguageSelector />
      
      {/* Compact dropdown */}
      <LanguageSelector compact />
    </div>
  );
}
```

### Translation Keys Structure

Translations are organized in nested objects:

```json
{
  "common": {
    "wallet": "Wallet",
    "send": "Send"
  },
  "walletSettings": {
    "title": "Wallet Settings"
  }
}
```

Access them using dot notation: `t('common.wallet')` or `t('walletSettings.title')`

## Adding New Translations

1. Add the key to all language files in `translations/`:
   - `en.json` (English - required)
   - `ru.json` (Russian)
   - `de.json` (German)
   - `fr.json` (French)

2. Use the translation key in your component:
   ```tsx
   {t('your.new.key')}
   ```

## Translation Files

### Common Translations (`common`)
Global strings used across multiple components:
- Wallet actions (send, receive, swap, buy)
- Navigation (portfolio, settings, transactions)
- Common UI (copy, cancel, confirm, close)
- Status messages (loading, error, success)

### Wallet Settings (`walletSettings`)
All strings specific to the wallet settings modal:
- Wallet information labels
- Security features
- Password protection
- Export/delete operations

## Language Persistence

The selected language is automatically saved to `localStorage` as `quasar_language` and persists across sessions.

## Best Practices

1. **Always provide English translations** - English is the fallback language
2. **Use semantic keys** - `common.send` instead of `sendButton`
3. **Group related translations** - Keep settings translations under `walletSettings`
4. **Test all languages** - Verify translations work and make sense in context
5. **Keep phrases concise** - UI space is limited, especially in compact views

## Technical Implementation

### TranslationContext
The `TranslationContext` provides:
- `t(key: string)` - Translation function
- `language` - Current language code
- `setLanguage(lang: Language)` - Change language function

### TranslationProvider
Wraps the entire application at entry points:
- `/pages/Popup/index.jsx`
- `/pages/Panel/index.jsx`
- `/pages/Options/index.jsx`
- `/pages/Newtab/index.jsx`
- `/pages/Web/index.jsx`

### Dynamic Imports
Translation files are loaded dynamically when the language changes, reducing initial bundle size.

## Future Enhancements

Potential improvements:
- Add more languages (Spanish, Chinese, Japanese, etc.)
- Pluralization support
- Date/time formatting per locale
- Number/currency formatting per locale
- RTL (Right-to-Left) language support

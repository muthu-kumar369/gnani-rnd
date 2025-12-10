# Stage 29: Multi-Language Support (i18n)

## Overview
Add internationalization support for multiple languages.

## Implementation Steps

### Step 1: Setup i18next
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'welcome': 'Welcome to Gnani',
          'send_message': 'Send message',
          'new_conversation': 'New conversation'
        }
      },
      es: {
        translation: {
          'welcome': 'Bienvenido a Gnani',
          'send_message': 'Enviar mensaje',
          'new_conversation': 'Nueva conversación'
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en'
  });
```

### Step 2: Use Translations
```tsx
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();
  
  return (
    <h1>{t('welcome')}</h1>
  );
};
```

### Step 3: Language Selector
```tsx
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
    </select>
  );
};
```

### Step 4: RTL Support
```css
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}
```

## Success Criteria
- ✅ All UI strings translatable
- ✅ Language switcher works
- ✅ RTL languages supported
- ✅ Translations complete for 5+ languages

## Estimated Time: 12 hours

# Locale/Translation Loading Issue in SSR

## Problem Description

You're experiencing a common issue with server-side rendering (SSR) and internationalization where:
1. The initial server-rendered page shows untranslated text (default English messages)
2. There's a visual "glitch" when the client-side JavaScript loads and applies the correct translations

## Root Cause

The issue occurs because of a mismatch between server-side and client-side locale detection:

### Server-Side Locale Detection
1. The server determines the locale from `config.localization.locale` in `configDefault.js` (defaults to 'en-US')
2. It does NOT detect the user's preferred language from browser headers or cookies
3. It renders the page with English translations only

### Client-Side Locale Detection
1. After hydration, the client-side code in `LocaleProvider` tries to detect the user's preferred locale:
   - First checks localStorage for a saved locale
   - Falls back to browser's `navigator.language`
   - Updates the React context with the detected locale
2. The `LocaleAwareIntlProvider` then loads the appropriate translation file
3. This causes a re-render with the correct translations, creating the "glitch"

## Code Analysis

### Server-Side (`server/dataLoader.js`)
```javascript
// The server always uses the default locale from config
const config = mergeConfig(hostedConfigAsset, defaultConfig);
const locale = isTestEnv ? 'en' : appConfig.localization.locale; // Always uses config locale
```

### Client-Side (`src/context/localeContext.js`)
```javascript
// Client tries to detect user's preferred locale
useEffect(() => {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
    setLocale(savedLocale);
  } else {
    // Detect browser locale as fallback
    const browserLocale = navigator.language.split('-')[0];
    if (SUPPORTED_LOCALES.includes(browserLocale)) {
      setLocale(browserLocale);
    }
  }
}, []);
```

## Solutions

### Solution 1: Server-Side Locale Detection (Recommended)

Modify the server to detect the user's preferred locale from the `Accept-Language` header:

```javascript
// In server/dataLoader.js or server/index.js
const getLocaleFromRequest = (req, supportedLocales, defaultLocale) => {
  // Check for explicit locale in URL/query params/cookies
  const urlLocale = req.query.lang; // or however you want to pass it
  if (urlLocale && supportedLocales.includes(urlLocale)) {
    return urlLocale;
  }
  
  // Check cookies
  const cookieLocale = req.cookies.locale;
  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    return cookieLocale;
  }
  
  // Parse Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const [locale] = lang.trim().split(';');
      return locale.split('-')[0]; // Extract language code (e.g., 'en' from 'en-US')
    });
    
    for (const lang of languages) {
      if (supportedLocales.includes(lang)) {
        return lang;
      }
    }
  }
  
  return defaultLocale;
};
```

Then pass this locale to the SSR process:

```javascript
// In server/index.js, when calling dataLoader.loadData
const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES, DEFAULT_LOCALE);
// Pass locale to dataLoader or modify appConfig.localization.locale
```

### Solution 2: Cookie-Based Locale Persistence

Ensure the locale is saved in cookies so the server can read it:

```javascript
// In src/context/localeContext.js
useEffect(() => {
  const savedLocale = localStorage.getItem('locale');
  let initialLocale = DEFAULT_LOCALE;
  
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
    initialLocale = savedLocale;
  } else {
    const browserLocale = navigator.language.split('-')[0];
    if (SUPPORTED_LOCALES.includes(browserLocale)) {
      initialLocale = browserLocale;
    }
  }
  
  setLocale(initialLocale);
  
  // Also save to cookie for server-side access
  document.cookie = `locale=${initialLocale}; path=/; max-age=31536000`; // 1 year
}, []);
```

### Solution 3: Preload Translations in SSR

Modify the SSR process to load translations for the detected locale:

```javascript
// In server/dataLoader.js
exports.loadData = function(requestUrl, sdk, appInfo) {
  // ... existing code ...
  
  // Detect locale (using method from Solution 1)
  const locale = getLocaleFromRequest(/* params */);
  
  // Load translations for the detected locale
  let translations = {};
  try {
    if (locale !== 'en') {
      // Load the appropriate translation file
      const translationModule = require(`../build/translations/${locale}.json`);
      translations = translationModule.default || translationModule;
    }
  } catch (e) {
    console.warn(`Failed to load translations for locale "${locale}", falling back to English`);
    translations = {};
  }
  
  // ... rest of the function
};
```

### Solution 4: CSS-Based Fallback (Quick Fix)

Hide untranslated content until translations are loaded:

```css
/* In src/styles/marketplaceDefaults.css */
.app-loading {
  visibility: hidden;
}

.app-loaded {
  visibility: visible;
}
```

```javascript
// In src/app.js ClientApp component
useEffect(() => {
  // Add loaded class to body when translations are ready
  document.body.classList.add('app-loaded');
  return () => {
    document.body.classList.remove('app-loaded');
  };
}, [/* dependencies when translations are ready */]);
```

## Recommended Implementation

1. Implement Solution 1 (server-side locale detection) as the primary fix
2. Combine with Solution 2 (cookie-based persistence) for consistent experience
3. Consider Solution 3 (preload translations) for better performance
4. Use Solution 4 as a temporary visual improvement if needed

This approach will ensure that:
- The server renders the page with the correct locale from the start
- There's no flash of untranslated content
- The user experience is smooth and consistent
- SEO is improved as search engines see properly translated content

## Implementation Steps

1. Add locale detection function to parse Accept-Language headers
2. Modify server-side data loading to use detected locale
3. Ensure translations are loaded for the detected locale during SSR
4. Save locale preference in cookies for future requests
5. Test with different browser languages to ensure consistency
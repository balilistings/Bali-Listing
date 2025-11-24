# Internationalization (i18n) and Localization Documentation

## Overview

The Balilistings web uses a comprehensive internationalization (i18n) and localization system built on top of `react-intl`. The system supports multiple languages and currencies, with the ability to switch between locales dynamically. The application is designed to work with both client-side rendering and server-side rendering.

## Supported Languages and Currencies

### Languages
The application currently supports:
- English ('en') - default locale
- French ('fr')
- German ('de')
- Spanish ('es')
- Indonesian ('id')
- Russian ('ru')

The supported locales are configurable through the `REACT_APP_SUPPORTED_LOCALES` environment variable in the `.env` file. This variable accepts a comma-separated list of locale codes. English ('en') is always included as the default locale, even if not explicitly listed in the environment variable.

Example:
```
REACT_APP_SUPPORTED_LOCALES=id,fr
```
This would result in the application supporting English, Indonesian, and French.

For more information about how supported locales are determined, see `src/util/translation.js`.

### Currencies
The application supports:
- Indonesian Rupiah (IDR)
- US Dollar (USD)

## Architecture Components

### 0. Environment Configuration

The i18n system is partially configured through environment variables defined in the `.env` file:

- `REACT_APP_SUPPORTED_LOCALES`: Defines which locales are supported by the application beyond English. This is a comma-separated list of locale codes (e.g., `id,fr`). The application always includes English as the default locale regardless of this setting.
- `REACT_APP_MULTICURRENCY_ENABLED`: Enables or disables the currency switching functionality in the UI.

The `getSupportedLocales()` function in `src/util/translation.js` reads this environment variable and returns an array of supported locale codes, ensuring English is always included.

### 1. Translation Files

Translation files are stored in the `src/translations/` directory with the following structure:
- `en.json` - Default translations
- `id.json` - Indonesian translations
- `de.json` - German translations
- `es.json` - Spanish translations
- `fr.json` - French translations
- `countryCodes.js` - Contains country code translations

Each translation file is a JSON object with key-value pairs where the key is a dot-separated identifier (e.g., "AuthenticationPage.loginLinkText") and the value is the localized string.

### 2. Locale Context System

The locale context system manages localization through several key components:

#### Hooks
- `useLocale()`: Provides current locale, messages, supported locales, default locale, and language names
- `useUpdateLocale()`: Allows updating the current locale

#### Functions
- `getInitialLocale()`: Retrieves the initial locale from user profile, URL path, or localStorage with the following priority:
  1. Current user's profile (if available)
  2. URL path segment (e.g., `/en/`, `/id/`)
  3. localStorage (remembered preference)
  4. Default locale (English)

- `languageNames`: Provides localized names for each supported language

The locale system uses localStorage to remember users' preferences between sessions and updates locale based on URL paths when users navigate between locale-specific routes.

### 3. Translation Loading and Handling

#### Loading Process
1. The application uses `react-intl`'s `IntlProvider` to provide translations
2. English (`en.json`) is used as the default/fallback language
3. Locale-specific translations are loaded dynamically when a locale is selected via dynamic imports
4. The `addMissingTranslations` utility ensures that any missing keys in locale-specific files fall back to the default English translations

#### Translation Initialization
The translation initialization happens in the `AppInitializers` component in `src/app.js`:
1. The initial locale is determined using `getInitialLocale()` which checks user profile, URL path, localStorage, and finally defaults to English
2. If the initial locale is not English, the corresponding translation file is dynamically imported
3. The translations are set in the Redux store using the `setMessages` action
4. Currency initialization also occurs, setting the initial currency based on user preferences

#### Dynamic Loading
When a user changes language, translations are loaded via dynamic imports:
```javascript
import(`./translations/${newLocale}.json`)
```

#### Server-Side Rendering Support
- In `server/renderer.js`, translations are serialized and injected into the HTML as a script tag: `window.__TRANSLATIONS__`
- This ensures translations are available on initial page load
- The server renders the app with the appropriate locale before sending HTML to the client

#### Hosted Translations
The application also supports hosted translations loaded from the Sharetribe backend and merged with local translations when available.

### 4. Currency Handling System

The application includes a currency management system:

#### Supported Currencies
- Indonesian Rupiah (IDR) and US Dollar (USD)
- Each currency includes name, code, and symbol information

#### Currency Management
- Uses Redux to manage the selected currency state
- Actions: `saveCurrency()` to save the selected currency
- Selector: `selectedCurrency` to get the currently selected currency from state
- Currency selection is stored in the Redux store and configurable through the application's config system

### 5. Routing System for Locale Handling

The routing system handles locale-specific URLs:

#### Locale Router Components
- `LocaleBrowserRouter` for client-side routing
- `LocaleStaticRouter` for server-side rendering

#### Locale Detection & Redirection
- Extracts locale from URL path segments (e.g., `/en/`, `/id/`)
- If locale is in URL and supported, updates application state
- If no locale in URL and current locale is not default, may redirect to locale-prefixed path
- Uses localStorage to remember if user prefers default locale

#### URL Manipulation Functions
- `getLocaleFromPath()`: Extracts locale from a given path
- `addLocaleToPath()`: Adds locale prefix to path (unless default locale)
- `removeLocaleFromPath()`: Removes locale prefix from path

### 6. UI Implementation

#### Language/Currency Menu
Located in `src/containers/TopbarContainer/Topbar/TopbarDesktop/LanguageCurrencyMenu/LanguageCurrencyMenu.js`:
- Shows language toggler when multiple locales are supported and not on EditListingPage
- Shows currency toggler when multi-currency is enabled and on appropriate pages (LandingPage, search, ListingPage)
- Handles locale switching by dynamically loading translations and updating URL
- Stores user's locale preference in localStorage

#### Translation Usage
Components use translations through:
- `FormattedMessage` component from `react-intl`
- Translation IDs like "TopbarDesktop.language" that map to the translation files

## Implementation Details

### Client-Side Implementation (`src/app.js`)

The `ClientApp` component implements the internationalization system:

1. Uses `LocaleAwareIntlProvider` to wrap the application with the appropriate locale and messages
2. Merges default messages with locale-specific messages and hosted translations
3. Handles locale initialization in `AppInitializers` component

### Server-Side Implementation (`src/app.js` and `server/renderer.js`)

The `ServerApp` component and server renderer implement i18n for server-side rendering:

1. `ServerApp` uses `LocaleStaticRouter` for static routing
2. `renderApp` function passes hosted translations to the server-rendered app
3. Server renderer serializes and injects translations into the HTML response

### Translation Management

#### Adding New Languages
1. Create a new JSON translation file in `src/translations/` (e.g., `ja.json` for Japanese)
2. Add the language code to the `REACT_APP_SUPPORTED_LOCALES` environment variable in your `.env` file
3. Add the language name to the `languageNames` object in `src/context/localeContext.js`

#### Adding New Translations
1. Add the translation key-value pair to the `en.json` file (as default)
2. Add the same key with localized value to other language files
3. Use the key in components with `FormattedMessage` component or `formatMessage` function

#### Using Translations in Components
```jsx
import { FormattedMessage } from 'react-intl';

// Using FormattedMessage
<FormattedMessage id="TopbarDesktop.language" defaultMessage="Language" />

// Using formatMessage hook
import { useIntl } from 'react-intl';
const intl = useIntl();
intl.formatMessage({ id: 'TopbarDesktop.language', defaultMessage: 'Language' });
```

## Best Practices

1. **Translation Keys**: Use descriptive, nested keys that reflect where the text is used (e.g., "ComponentName.textPurpose")
2. **Default Translations**: Always keep English as the default language and ensure all keys are present in the English file
3. **Dynamic Loading**: Leverage dynamic imports to load translation files only when needed
4. **Server-Side Compatibility**: Ensure all translations are available during server-side rendering
5. **URL Handling**: Maintain locale information in URLs to preserve user's language preference across navigation
6. **Fallback Strategy**: Implement proper fallback mechanism for missing translations
7. **Performance**: Consider translation file sizes and loading times, especially for mobile users

## Troubleshooting

### Common Issues

1. **Missing Translations**: Ensure all translation keys exist in the default language file (en.json)
2. **Server Rendering Issues**: Verify that translations are properly serialized in server responses
3. **Locale Switching Problems**: Check that URL paths are correctly updated when switching locales
4. **Currency Display Issues**: Confirm that currency formatting is handled appropriately across different locales
5. **Unsupported Locale Display**: If locale selector doesn't show expected languages, check that `REACT_APP_SUPPORTED_LOCALES` environment variable includes the desired locale codes

### Debugging Tips

1. Inspect `window.__TRANSLATIONS__` in browser console to verify server-side translations
2. Check Redux store for locale and messages state
3. Verify translation files contain all necessary keys
4. Test locale switching functionality across different pages
5. Check the value of `process.env.REACT_APP_SUPPORTED_LOCALES` in the browser console to verify environment variable configuration
6. Verify that `getSupportedLocales()` returns the expected list of locales in the browser console

## Future Considerations

1. **Automatic Translation Updates**: Consider implementing a system to automatically update translations from external sources
2. **Pluralization and Gender**: Implement advanced i18n features for languages with complex pluralization rules
3. **Right-to-Left (RTL) Support**: Add RTL layout support for languages like Arabic or Hebrew
4. **Date/Time Localization**: Ensure date and time formatting follows locale-specific conventions
5. **Number and Currency Formatting**: Ensure proper formatting of numbers and currencies based on locale
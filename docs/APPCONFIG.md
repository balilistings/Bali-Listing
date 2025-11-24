# AppConfig Documentation for `src/app.js`

This document explains how the `appConfig` object is constructed and used within the `src/app.js` file of the Sharetribe Web Template.

## Overview

The `appConfig` object serves as the central configuration for the application, influencing branding, localization, layout, access control, and other marketplace-specific settings. It's used throughout the application to tailor the user experience and behavior based on the marketplace's requirements.

The construction of `appConfig` involves merging configurations from two primary sources:

1.  `hostedConfig`: Configuration data fetched from the Sharetribe Console (hosted assets). This allows for runtime configuration changes without redeploying the application.
2.  `defaultConfig`: The default configuration defined in `src/config/configDefault.js`. This acts as a fallback for any settings not provided by the hosted configuration.

This merging happens using the `mergeConfig(hostedConfig, defaultConfig)` utility function.

## Construction Process

1.  **Hosted Config Fetching (Higher Order)**:
    *   In `src/index.js` (client-side) and `server/renderer.js` (server-side), the application dispatches the `fetchAppAssets` action (`src/ducks/hostedAssets.duck.js`).
    *   This action retrieves assets from the Sharetribe Console, including the `config.json` file.
    *   The content of `config.json` (if available) is parsed and becomes part of the Redux store under `state.hostedAssets`.

2.  **App Component Initialization (`src/app.js`)**:
    *   Both `ClientApp` and `ServerApp` components receive `hostedConfig` and `hostedTranslations` as props. For `ClientApp`, these come from the initial `ReactDOM.hydrateRoot` or `ReactDOM.createRoot` call in `src/index.js`. For `ServerApp`, they are passed from `server/renderer.js`.
    *   Inside `ClientApp` and `ServerApp`, the `appConfig` is created by calling:
        ```javascript
        const appConfig = mergeConfig(hostedConfig, defaultConfig);
        ```
    *   The `mergeConfig` function (defined in `src/util/configHelpers.js`) performs a deep merge. Properties defined in `hostedConfig` take precedence over those in `defaultConfig`. If a property is missing in `hostedConfig`, the value from `defaultConfig` is used.

3.  **Usage of `appConfig`**:
    *   The constructed `appConfig` is then passed down to the application's core providers:
        *   `<ConfigurationProvider value={appConfig}>`: This makes `appConfig` available to any component via the `useConfiguration()` hook.
        *   `<RouteConfigurationProvider value={routeConfiguration(appConfig.layout, appConfig?.accessControl)}>`: The `appConfig` is used to configure the application's routes, specifically influencing layouts and access control settings.
    *   The `appConfig` is also used for:
        *   Setting up internationalization (`locale`).
        *   Applying branding styles (marketplace color) via `includeCSSProperties`.
        *   Configuring the `IncludeScripts` component.
        *   Checking for `hasMandatoryConfigurations` to determine if the app should render normally or show a maintenance mode page.

## Key Configuration Areas within `appConfig`

While the exact structure depends on `configDefault.js` and the hosted `config.json`, common areas include:

*   **`branding`**: Marketplace name, logo URLs, colors.
*   **`layout`**: Settings for different page layouts (e.g., search page variant, listing page variant).
*   **`listing`**: Listing types, fields, images configuration.
*   **`search`**: Default filters, sort configuration.
*   **`maps`**: Map provider settings, search configurations.
*   **`localization`**: Default locale, currency.
*   **`accessControl`**: Settings for private marketplaces, user approval requirements.
*   **`stripe`**: Stripe integration settings (publishable key, supported countries/currencies).
*   **`analytics`**: Google Analytics ID.
*   **`socialMedia`**: Links to social media profiles.
*   **`meta`**: Default meta tags (description, social media tags).
*   **`hasMandatoryConfigurations`**: A flag indicating if all critical configurations are present.

This layered approach using `mergeConfig` allows for a flexible and maintainable configuration system, separating default settings from customizable, hosted settings.
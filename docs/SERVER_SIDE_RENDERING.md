# Server-Side Rendering (SSR) in Sharetribe Web Template

This document explains how Server-Side Rendering (SSR) is implemented in the Sharetribe Web Template. This explanation is designed to be useful for both humans and AI systems trying to understand the architecture.

## Overview

The Sharetribe Web Template implements server-side rendering to improve performance, SEO, and user experience. The implementation uses React's server-side rendering capabilities along with code splitting through `@loadable/component` and `@loadable/server`.

## Key Components

### 1. Entry Point (`src/index.js`)

The main entry point serves dual purposes:
- Client-side rendering when loaded in the browser
- Server-side rendering when imported on the server

Key exports for SSR:
```javascript
export default renderApp; // Main rendering function
export {
  matchPathname,      // Route matching
  configureStore,      // Redux store setup
  routeConfiguration,  // Route definitions
  defaultConfig,       // Default configuration
  mergeConfig,         // Configuration merging
  fetchAppAssets       // Asset fetching
};
```

### 2. App Component (`src/app.js`)

Contains two main app components:

#### `ServerApp`
- Used specifically for server-side rendering
- Uses `LocaleStaticRouter` instead of `LocaleBrowserRouter`
- Accepts URL, context, and helmetContext as props
- Does not interact with browser APIs (e.g., `window`)

#### `ClientApp`
- Used for client-side rendering
- Uses `LocaleBrowserRouter` for client-side routing
- Interacts with browser APIs
- Hydrates the server-rendered markup

#### `renderApp` Function
The main SSR function that:
1. Configures the Redux store with preloaded state
2. Sets up helmet context for metadata
3. Wraps the app with chunk collection for code splitting
4. Renders the app to a string using `ReactDOMServer.renderToString`
5. Returns head metadata and body content

```javascript
export const renderApp = (
  url,
  serverContext,
  preloadedState,
  hostedTranslations,
  hostedConfig,
  collectChunks
) => {
  // Configure store with preloaded state
  const store = configureStore(preloadedState);
  const helmetContext = {};

  // Wrap with chunk collection for code splitting
  const WithChunks = collectChunks(
    <ServerApp
      url={url}
      context={serverContext}
      helmetContext={helmetContext}
      store={store}
      hostedTranslations={hostedTranslations}
      hostedConfig={hostedConfig}
    />
  );

  // Render to string
  return import('react-dom/server').then(mod => {
    const { default: ReactDOMServer } = mod;
    const body = ReactDOMServer.renderToString(WithChunks);
    const { helmet: head } = helmetContext;
    return { head, body };
  });
};
```

### 3. Server Implementation (`server/index.js`)

The main server file that handles SSR requests:

1. Sets up Express middleware
2. Handles static assets
3. Routes API requests
4. Processes all other requests through SSR

Key SSR handling:
```javascript
app.get('*', async (req, res) => {
  const context = {};
  
  // Get chunk extractors for code splitting
  const { nodeExtractor, webExtractor } = getExtractors();
  
  // Load server-side entrypoint
  const nodeEntrypoint = nodeExtractor.requireEntrypoint();
  const { default: renderApp, ...appInfo } = nodeEntrypoint;
  
  const sdk = sdkUtils.getSdk(req, res);
  
  // Preload data for the route
  dataLoader
    .loadData(req.url, sdk, appInfo)
    .then(data => {
      // Render the app with preloaded data
      const cspNonce = cspEnabled ? res.locals.cspNonce : null;
      return renderer.render(req.url, context, data, renderApp, webExtractor, cspNonce);
    })
    .then(html => {
      // Handle redirects, errors, and normal responses
      if (context.url) {
        res.redirect(context.url);
      } else if (context.notfound) {
        res.status(404).send(html);
      } else {
        res.send(html);
      }
    });
});
```

### 4. Data Loading (`server/dataLoader.js`)

Preloads data needed for server-side rendering:

1. Matches the requested URL to routes
2. Executes `loadData` functions for matched routes
3. Returns preloaded state for Redux store hydration

```javascript
exports.loadData = function(requestUrl, sdk, appInfo) {
  const {
    matchPathname,
    configureStore,
    routeConfiguration,
    defaultConfig,
    mergeConfig,
    fetchAppAssets,
  } = appInfo;
  
  const store = configureStore({}, sdk);
  
  // Fetch app assets and preload route data
  return store
    .dispatch(fetchAppAssets(defaultConfig.appCdnAssets))
    .then(fetchedAppAssets => {
      // Process translations and hosted configs
      translations = translationsRaw?.data || {};
      hostedConfig = { ...hostedConfig, ...extractHostedConfig(rest) };
      
      // Execute loadData functions for matched routes
      return Promise.all(dataLoadingCalls(hostedConfig));
    })
    .then(() => {
      return { preloadedState: store.getState(), translations, hostedConfig };
    });
};
```

### 5. Rendering (`server/renderer.js`)

Takes the rendered app content and injects it into the HTML template:

1. Uses the built `index.html` as a template
2. Injects server-rendered content into the template
3. Adds preloaded state for client-side hydration
4. Includes necessary scripts and styles for code splitting

Key template interpolation:
```javascript
return template({
  htmlAttributes: head.htmlAttributes.toString(),
  title: head.title.toString(),
  link: head.link.toString(),
  meta: head.meta.toString(),
  script: head.script.toString(),
  preloadedStateScript, // Injects preloaded Redux state
  ssrStyles: webExtractor.getStyleTags(),   // SSR styles from code splitting
  ssrLinks: webExtractor.getLinkTags(),     // SSR links from code splitting
  ssrScripts: webExtractor.getScriptTags(nonceParamMaybe), // SSR scripts from code splitting
  body, // Server-rendered app content
});
```

### 6. Code Splitting Integration

Uses `@loadable/component` and `@loadable/server` for code splitting:

1. `webExtractor.collectChunks()` wraps the app during SSR to track which chunks are needed
2. `webExtractor.getStyleTags()`, `webExtractor.getLinkTags()`, and `webExtractor.getScriptTags()` generate the necessary tags for client-side hydration
3. Client-side `loadableReady()` ensures all required chunks are loaded before hydration

## SSR Flow

1. **Request arrives**: Express server receives a request for a page
2. **Route matching**: `dataLoader.js` determines which route matches the URL
3. **Data preloading**: Executes `loadData` functions for the matched route
4. **Store configuration**: Creates Redux store with preloaded state
5. **App rendering**: `renderApp` function renders the React app to a string
6. **Chunk collection**: `@loadable/server` tracks which code chunks are needed
7. **Template injection**: `renderer.js` injects the rendered content into HTML template
8. **Response**: Complete HTML page is sent to the client
9. **Client hydration**: Client-side app hydrates the server-rendered markup

## Benefits

1. **Improved Performance**: Faster initial page loads
2. **Better SEO**: Search engines can index server-rendered content
3. **Social Sharing**: Social media platforms can properly preview pages
4. **Progressive Enhancement**: Works even with JavaScript disabled
5. **Code Splitting**: Only loads necessary code for each page

## Key Considerations

1. **Security**: Preloaded state is sanitized to prevent XSS attacks
2. **Environment Detection**: Different components are used for client vs server
3. **Browser APIs**: Server-side code avoids browser-specific APIs
4. **Error Handling**: Graceful fallbacks for SSR failures
5. **CSP Support**: Content Security Policy integration
# Routing in the Bali-Listing Project

This document explains how routing works in the Bali-Listing project, which is based on the Sharetribe Web Template. The routing system is built on React Router and provides a flexible way to define routes, connect them to container components, and manage data loading.

## Overview

The routing system in this project is composed of several key components:

1. **Route Configuration** - Defines all available routes and their properties
2. **Routes Component** - Renders the actual React Router components based on configuration
3. **Container Components** - Page-level components that are rendered for each route
4. **Data Loading** - Mechanism for loading data required by each route
5. **Context Providers** - Makes route configuration available throughout the app

## Route Configuration

The main routing configuration is defined in `src/routing/routeConfiguration.js`. This file exports a function that returns an array of route objects with the following properties:

```javascript
{
  path: '/l/:slug/:id',           // URL path with parameters
  name: 'ListingPage',            // Unique route name
  component: ListingPage,         // React component to render
  loadData: pageDataLoadingAPI.ListingPage.loadData, // Data loading function
  auth: true,                     // Authentication required (optional)
  authPage: 'LoginPage',          // Redirect page for unauthenticated users (optional)
  extraProps: { ... },            // Additional props to pass to component (optional)
}
```

### Route Properties

- **path**: The URL path pattern (supports parameters like `:id`)
- **name**: A unique identifier for the route
- **component**: The React component to render for this route
- **loadData**: Function that loads necessary data for the route (optional)
- **auth**: Boolean indicating if authentication is required (optional)
- **authPage**: Route name to redirect unauthenticated users to (optional)
- **extraProps**: Additional props to pass to the component (optional)

### Dynamic Route Components

The configuration supports dynamic component selection based on configuration settings:

```javascript
const SearchPage = layoutConfig.searchPage?.variantType === 'map' 
  ? SearchPageWithMap 
  : SearchPageWithGrid;
```

## Routes Component

The `src/routing/Routes.js` file contains the main Routes component that creates the React Router setup. It:

1. Maps over the route configuration to create React Router `<Route>` components
2. Handles authentication checks
3. Manages data loading for each route
4. Handles scroll position management
5. Provides error boundaries for dynamically loaded components

### Data Loading

The Routes component automatically calls the `loadData` function for each route when it's rendered. This happens in the `RouteComponentRenderer` class:

```javascript
const callLoadData = props => {
  const { match, location, route, dispatch, logoutInProgress, config } = props;
  const { loadData, name } = route;
  const shouldLoadData =
    typeof loadData === 'function' && canShowComponent(props) && !logoutInProgress;

  if (shouldLoadData) {
    dispatch(loadData(match.params, location.search, config))
      .then(() => {
        // Success handling
      })
      .catch(e => {
        // Error handling
      });
  }
};
```

## Container Components

Each route is connected to a container component located in `src/containers/`. These components:

1. Receive route parameters as props (`params`, `location`, etc.)
2. May have a corresponding `.duck.js` file for Redux actions/reducers
3. Implement the `loadData` function for fetching required data
4. Render the UI for the specific page

### loadData Function

Container components that need to load data implement a `loadData` function that:

1. Takes route parameters and search query as arguments
2. Dispatches Redux actions to fetch data
3. Returns a Promise that resolves when data loading is complete

Example from `LandingPage.duck.js`:

```javascript
export const loadData = (params, search) => dispatch => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true))
    .then(() => {
      dispatch(fetchFeaturedListings());
      return true;
    })
    .catch(e => {
      log.error(e, 'landing-page-fetch-failed');
    });
};
```

## Context Providers

The routing system uses React Context to make route configuration available throughout the app:

1. `RouteConfigurationContext` - Provides the route configuration array
2. `ConfigurationContext` - Provides app configuration that affects route behavior

These contexts are set up in `src/app.js`:

```javascript
const Configurations = props => {
  const { appConfig, children } = props;
  const routeConfig = routeConfiguration(appConfig.layout, appConfig?.accessControl);
  
  return (
    <ConfigurationProvider value={appConfig}>
      <MomentLocaleLoader locale={locale}>
        <RouteConfigurationProvider value={routeConfig}>
          {children}
        </RouteConfigurationProvider>
      </MomentLocaleLoader>
    </ConfigurationProvider>
  );
};
```

## Authentication Handling

The routing system handles authentication through:

1. The `auth` property in route configuration
2. The `RouteComponentRenderer` class that checks authentication status
3. Automatic redirects to authentication pages for protected routes

For routes requiring authentication:
```javascript
{
  path: '/l/:slug/:id/checkout',
  name: 'CheckoutPage',
  auth: true,
  component: CheckoutPage,
  setInitialValues: pageDataLoadingAPI.CheckoutPage.setInitialValues,
}
```

Unauthenticated users will be redirected to the page specified by `authPage` (defaulting to 'SignupPage').

## Dynamic Imports

Components are loaded dynamically using `@loadable/component` for better code splitting:

```javascript
const CheckoutPage = loadable(() => import(/* webpackChunkName: "CheckoutPage" */ '../containers/CheckoutPage/CheckoutPage'));
```

This improves initial loading performance by only loading the code needed for the current route.

## URL Helpers

The project includes utility functions for working with routes:

1. `createResourceLocatorString` - Generates URLs for named routes
2. `pathByRouteName` - Gets the path pattern for a route by name
3. `canonicalRoutePath` - Gets the canonical path for the current location

## Server-Side Rendering

The routing system supports server-side rendering through:

1. The `ServerApp` component that uses `StaticRouter`
2. The `renderApp` function that renders the app on the server
3. Proper handling of initial data loading for SSR

## Adding New Routes

To add a new route:

1. Create a new container component in `src/containers/`
2. Add a new entry to the route configuration in `src/routing/routeConfiguration.js`
3. If the component needs to load data, implement a `loadData` function in a corresponding `.duck.js` file
4. Add the data loading function to `src/containers/pageDataLoadingAPI.js`

Example:
```javascript
// In routeConfiguration.js
{
  path: '/my-new-page',
  name: 'MyNewPage',
  component: MyNewPage,
  loadData: pageDataLoadingAPI.MyNewPage.loadData,
}
```

## Key Features

1. **Code Splitting**: Components are loaded dynamically for better performance
2. **Authentication**: Built-in support for protected routes
3. **Data Loading**: Automatic data loading for routes with support for SSR
4. **Flexible Configuration**: Route components can be dynamically selected based on configuration
5. **Error Handling**: Error boundaries for dynamically loaded components
6. **Scroll Management**: Automatic scroll position handling during navigation
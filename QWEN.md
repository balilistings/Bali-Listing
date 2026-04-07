# Bali-Listing Project Context

## Project Overview

This project is a customized Sharetribe Web Template, designed to create a unique marketplace web application. Sharetribe is a platform for creating peer-to-peer marketplaces, and this template provides a starting point for building such applications using React, Node.js, and Express.

The application is structured with a client-side React frontend and a server-side Node.js/Express backend that handles server-side rendering (SSR), API endpoints, authentication, and serving static assets. It's bootstrapped with `create-react-app` (via `sharetribe-scripts`) but includes additional features like SSR and code-splitting.

## Key Technologies

*   **Frontend:** React 18, Redux
*   **Backend:** Node.js, Express
*   **Build Tools:** Webpack (via `sharetribe-scripts`), Yarn
*   **Styling:** CSS Modules
*   **Routing:** React Router
*   **Internationalization:** react-intl
*   **State Management:** Redux
*   **UI Components:** Custom component library (e.g., `Page`, `Button`, `ModalInMobile`)
*   **Maps:** Mapbox GL JS (implied by dependencies and `SearchMap`)
*   **Authentication:** Passport.js (for social logins like Facebook/Google)
*   **Data Fetching:** Custom SDK (`sharetribe-flex-sdk`) for interacting with the Sharetribe backend.
*   **Code Splitting:** `@loadable/component`
*   **Analytics:** Google Analytics (optional)
*   **Error Tracking:** Sentry (optional)
*   **Security:** Helmet, CSP (Content Security Policy)

## Project Structure

*   `src/`: Contains the main React application source code.
    *   `components/`: Reusable UI components.
    *   `containers/`: Higher-order components, often tied to specific routes or pages.
    *   `ducks/`: Redux actions, reducers, and selectors.
    *   `util/`: Utility functions.
    *   `config/`: Client-side configuration (settings, default configurations).
    *   `styles/`: Global and default CSS.
    *   `routing/`: Route definitions and configuration.
*   `server/`: Contains the Node.js/Express server code for SSR, API endpoints, and static file serving.
*   `public/`: Static assets served directly by the server (e.g., favicons, manifest).
*   `scripts/`: Custom scripts for configuration, deployment, etc.
*   `ext/`: External modules or integrations.
*   `build/`: Output directory for the built application (frontend and server bundles).

## Building and Running

### Development

1.  Ensure Node.js (version >=18.20.1, <23.2.0) and Yarn are installed.
2.  Install dependencies: `yarn install`
3.  Configure environment variables: `yarn run config` (This sets up a basic `.env` file. You may need to edit it further for your specific setup, especially the SDK client ID and secret).
4.  Start the development server: `yarn run dev`
    *   This command concurrently runs the frontend development server (`sharetribe-scripts start`) and the backend API server (`nodemon server/apiServer.js`) in development mode.
    *   It will typically open the application in your browser at `http://localhost:3000`.

### Production

1.  Build the application: `yarn run build`
    *   This creates optimized bundles for both the client-side (`build/static`) and server-side (`build/server`) parts of the application.
2.  Start the production server: `yarn start`
    *   This runs the built server application using `node`, which serves the built client-side assets and handles SSR.

### Testing

*   Run tests: `yarn run test`
    *   Uses Jest and Testing Library for client-side unit and integration tests.
*   Run server-side tests: `yarn run test-server`

### Code Formatting

*   Format code: `yarn run format`
*   Check formatting (CI): `yarn run format-ci`

## Development Conventions

*   **Environment Variables:** Client-side environment variables must be prefixed with `REACT_APP_` to be included in the build. Server-side variables do not require this prefix but are typically defined in `.env` files.
*   **Routing:** Routes are defined in `src/routing/routeConfiguration.js`. Each route maps a path to a component and can specify data loading logic.
*   **Data Loading:** Data for pages is typically loaded in `loadData` functions defined in containers or associated duck files. This supports both client-side navigation and server-side rendering.
*   **Configuration:** Client-side settings are in `src/config/settings.js`. Default configurations and branding are in `src/config/configDefault.js`. Server-side configuration is handled in `server/env.js`.
*   **State Management:** Uses Redux. Ducks (actions, reducers, selectors in one file) are located in `src/ducks/`.
*   **Styling:** Uses CSS Modules (`.module.css`) for component-scoped styling.
*   **Code Splitting:** Uses `@loadable/component` for dynamic imports to split the code into smaller bundles.
*   **Search Page:** A key part of the marketplace is the search functionality. The `SearchPage` component (specifically `SearchPageWithMap` in this case) is highly customizable. Custom filters are implemented in `src/containers/SearchPage/CustomFilters/`.
*   **Authentication:** Authentication is handled by Passport.js on the server side, with routes defined in `server/api/auth/`. The `AuthenticationPage` container handles the login/signup UI.

## Key Customizations (Observed)

*   The `SearchPageWithMap` component has been customized to include a modal `CustomFilters` component (`src/containers/SearchPage/CustomFilters/CustomFilters.js`).
*   This `CustomFilters` component dynamically renders filter options (like price, bedrooms, amenities) based on the selected listing category (`rentalvillas`, `villaforsale`, `landforsale`).
*   Individual filter components (e.g., `BedroomsSelector`, `PriceSelector`) are located within the `CustomFilters` directory.
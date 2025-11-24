# Search Page Filtering and URL Routing Documentation

## Overview

This document explains how the custom filtering system works within the `src/containers/SearchPage/CustomFilters/` directory and how it interacts with URL parameters to refine search results. It also covers the `SortBy` component's role in modifying the URL.

The filtering system is designed to be dynamic and category-specific. When a user interacts with a filter component (e.g., selects amenities, changes price range), the system updates the browser's URL query parameters. This URL change triggers a new search, fetching and displaying listings that match the selected criteria.

## Core Filtering Components

### `CustomFilters.js` (Parent Component)

The `CustomFilters` component acts as the central hub for all filtering logic.

1.  **State Management**: It uses React `useState` hooks to maintain the state of each filter (e.g., `selectedAmenities`, `priceRange`, `selectedCategory`). These states are often initialized by parsing the current URL's query parameters (see `initialise*` functions).
2.  **Child Filter Components**: It renders various filter sub-components (like `AmenitiesSelector`, `PriceSelector`, `BedroomsSelector`, etc.) based on the currently selected `category`.
3.  **Category-based Filtering**: The `categoryFilterConfig` object defines which filters are relevant for each listing category (`rentalvillas`, `villaforsale`, `landforsale`). This allows the UI to adapt dynamically.
4.  **URL Update Mechanism**: It receives two key callback functions as props:
    *   `onUpdateCurrentQueryParams`: This function is responsible for the actual URL update. When a filter value changes, the corresponding child component calls this function, passing an object that maps URL query parameter keys (e.g., `pub_bedrooms`, `pub_pool`) to their new values. This function ultimately calls `props.getHandleChangedValueFn(true)` in `SearchPageWithMap.js`, which in turn calls `history.push` to navigate to the new URL with updated parameters.
    *   `onlyUpdateCurrentQueryParams`: This is used for temporary state updates that don't immediately trigger a URL change (e.g., updating the price range as the slider moves, but only pushing the URL when the user releases the slider or clicks "Show Listings"). It updates the `currentQueryParams` state in `SearchPageWithMap.js` without navigation.

### Individual Filter Components (e.g., `AmenitiesSelector`, `PriceSelector`)

Each specific filter component (e.g., `AmenitiesSelector.js`, `BedroomsSelector.js`) is responsible for:

1.  **UI Rendering**: Displaying the filter options (checkboxes, sliders, dropdowns) to the user.
2.  **Local Interaction Handling**: Managing user interactions specific to that filter (e.g., toggling an amenity checkbox, moving a price slider).
3.  **Mapping to URL Params**: Converting the user's selections into the appropriate URL query parameter format.
    *   **Example (`AmenitiesSelector`)**: When a user selects "Pool" and "Wifi", the `handleAmenitiesChange` function is triggered. It calls `onAmenitiesChange(['pool', 'wifi'])`. The parent `CustomFilters` component receives this and maps it to an object like `{ pub_pool: 'yes', pub_wifi: 'yes', pub_gym: null, ... }` (setting unselected amenities to `null` to remove them from the URL). This object is then passed to `onUpdateCurrentQueryParams`.
    *   **Example (`PriceSelector`)**: When a user selects a monthly price range (e.g., 5M to 20M), the `handlePriceRangeChange` function is called. It formats this range and determines the active period (`monthly`), creating an object like `{ pub_monthprice: "5000000,20000000" }`. This is passed to `onUpdateCurrentQueryParams`.
4.  **Calling Parent Callbacks**: Invoking the `onUpdateCurrentQueryParams` or `onlyUpdateCurrentQueryParams` (or specific helper functions passed down from `CustomFilters`) to propagate the changes up to the parent for URL update.

## URL Parameter Handling and Routing

### Interaction Flow

1.  **User Interaction**: A user selects a filter option in the UI (e.g., clicks "3 Bedrooms").
2.  **Component State Update**: The specific filter component (`BedroomsSelector`) updates its local representation of the selection.
3.  **Callback Invocation**: The filter component calls a handler function provided by the `CustomFilters` parent (e.g., `handleBedroomsChange`).
4.  **Parameter Mapping (Parent)**: The `CustomFilters` component (`handleBedroomsChange`) maps the internal state change to a set of URL query parameters (e.g., `{ pub_bedrooms: 3 }`).
5.  **URL Update Trigger (Parent)**: `CustomFilters` calls the `onUpdateCurrentQueryParams` prop, passing the mapped parameters.
6.  **URL Update (Grandparent/SearchPage)**: The `SearchPageWithMap` component (which rendered `CustomFilters`) provides the `onUpdateCurrentQueryParams` prop. Internally, this uses the `getHandleChangedValueFn(true)` function. This function takes the new parameters, merges them with the current URL parameters, and calls `history.push(createResourceLocatorString(...))`.
7.  **Navigation and Re-render**: `history.push` triggers a navigation to the new URL (e.g., `/s?pub_categoryLevel1=rentalvillas&pub_bedrooms=3`). React Router detects this URL change and re-renders the `SearchPageWithMap` component.
8.  **New Search Triggered**: The re-render causes the `SearchPageWithMap` component's data loading logic (`loadData` from `SearchPage.duck.js`, triggered via Redux) to run again. This new data load uses the updated URL parameters to query the backend for listings matching the new filter criteria.
9.  **Results Display**: The filtered listings are fetched and displayed to the user.

### Key URL Parameter Patterns

*   **Category**: `pub_categoryLevel1=rentalvillas`
*   **Standard Filters**:
    *   Bedrooms: `pub_bedrooms=3`
    *   Bathrooms: `pub_bathrooms=2`
    *   Property Type: `pub_propertytype=villa,apartment`
*   **Amenities**: Multiple boolean-like parameters are often used. Selecting an amenity sets its value to "yes" (e.g., `pub_pool=yes`). Unselecting it sets the value to `null`, effectively removing it from the URL.
*   **Price**:
    *   For rentals (dynamic pricing): `pub_weekprice=1000000,50000000`, `pub_monthprice=5000000,150000000`, `pub_yearprice=50000000,500000000`
    *   For sales (fixed price): `price=500000000,2000000000` (500M to 2B)
*   **Location**: Typically handled by `address` and `bounds` parameters (e.g., `address=Canggu&bounds=...`).

## Sorting (`SortBy` Component)

The `SortBy` component allows users to change the order of the search results.

1.  **Options**: It provides sorting options defined in the marketplace configuration (`config.search.sortConfig.options`), such as relevance, newest, lowest price, highest price.
2.  **URL Parameter**: It uses a specific query parameter (defined by `config.search.sortConfig.queryParamName`, often `sort`) to store the current sorting preference.
3.  **Interaction**: When a user selects a sort option, the `SortBy` component calls its `onSelect` prop (provided by `SearchPageWithMap`).
4.  **URL Update**: Similar to filters, `SearchPageWithMap`'s `handleSortBy` function is invoked. It updates the URL query parameters (e.g., adding/modifying `?sort=-createdAt` for newest first) using `history.push`.
5.  **New Search**: The URL change triggers a re-render and a new `loadData` call, which includes the `sort` parameter in its request to the backend, fetching results in the specified order.

## How URL Parameter Changes Trigger Data Retrieval

The core mechanism linking URL changes to data retrieval involves React Router, Redux, and the `SearchPage` component's data loading logic (`SearchPage.duck.js`).

1.  **URL Change Initiates Navigation**: When a filter or sort action updates the URL (e.g., via `history.push`), React Router detects the change.
2.  **Re-render of `SearchPage`**: The `SearchPage` component (or its variants like `SearchPageWithMap`) re-renders because its route props (`location`, `match`) have changed.
3.  **`useEffect` Hook Triggers Data Load**: Within the `SearchPage` component, a `useEffect` hook (often indirectly managed by a Redux-connected container like `SearchPage.duck.js`) monitors changes to relevant props derived from the URL, such as `searchParams`.
4.  **`searchParamsPicker` Function**: This utility function (`src/containers/SearchPage/SearchPage.shared.js`) plays a crucial role. It parses the `location.search` string, validates the parameters against the marketplace configuration, and produces a clean object of search parameters (`urlQueryParams`) suitable for the API call. It also compares the parameters from the URL with those potentially held in the Redux state to determine if they are "in sync".
5.  **Redux Action Dispatched**: If the parameters have changed and are deemed valid/synced, a Redux action (e.g., `searchListingsRequest` in `SearchPage.duck.js`) is dispatched.
6.  **API Request in Redux Saga/Duck**: The Redux action triggers a corresponding saga or effect in `SearchPage.duck.js`. This saga constructs the final API query using the validated `urlQueryParams` and calls the Sharetribe SDK (e.g., `sdk.listings.query`).
7.  **Data Fetching**: The SDK makes the actual HTTP request to the Sharetribe backend API with the constructed query parameters.
8.  **Data Processing and Storage**: Upon receiving the response, the Redux saga processes the data (e.g., normalizing listings) and dispatches a success action (e.g., `searchListingsSuccess`) which updates the Redux store (`marketplaceData.duck.js`).
9.  **UI Update**: The `SearchPage` component, connected to the Redux store, receives the updated listings data via props and re-renders the listings panel, map markers, and pagination controls accordingly.

This cycle repeats every time the URL search parameters are modified, ensuring the UI always reflects the current search state.

## Summary

The filtering system relies on a unidirectional data flow: User interaction -> Component State -> URL Parameter Mapping -> URL Update via `history.push` -> React Router Navigation -> Data Reload with New Parameters -> UI Update with Filtered Results. This ensures that the URL accurately reflects the current search state, making searches bookmarkable and shareable.
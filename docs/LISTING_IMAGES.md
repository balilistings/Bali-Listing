# Listing Images Documentation

This document explains how listings and their images are retrieved and handled in the Bali-Listing Sharetribe Flex marketplace application.

## Overview

In the Bali-Listing project, listings and their images are retrieved from the Sharetribe Flex platform and displayed to users through a well-structured data flow involving the Redux store, API queries, and React components.

## Listing Retrieval Flow

### 1. Data Loading
When the SearchPage loads, the `loadData` function in `SearchPage.duck.js` is called, which dispatches the `searchListings` action.

### 2. API Query
The `searchListings` function makes a query to the Sharetribe Flex SDK:
```javascript
return sdk.listings.query(params)
```

### 3. Image Inclusion
In the query parameters, images are explicitly included:
```javascript
include: ['author', 'images'],
'fields.image': [
  'variants.scaled-small',
  'variants.scaled-medium',
  'variants.landscape-crop2x',
  // ... other variants
],
```

### 4. Data Processing
The response from the API is processed and stored in the Redux store through the `addMarketplaceEntities` action, which uses the `updatedEntities` function to normalize the data.

### 5. Data Access
In the SearchPage component, listings are retrieved from the Redux store using the `getListingsById` selector:
```javascript
const listings = getListingsById(state, currentPageResultIds);
```

## Image Handling

### Image Storage
Images are stored as part of the listing entity in the Redux store. Each listing has an `images` array containing image objects with different variants.

### Image Display
In the `ListingCard` component, images are accessed from the listing object:
```javascript
const imagesUrls = currentListing.images.map(
  img => img.attributes.variants['landscape-crop2x']?.url
);
```

### Image Variants
The platform generates multiple image variants automatically:
- `scaled-small`
- `scaled-medium`
- `landscape-crop2x`
- Custom variants based on configuration

### Slider Component
The `ListingCard` uses a slider to display multiple images for each listing, mapping through the `imagesUrls` array to render each image:
```javascript
{imagesUrls.map((img, imgIdx) => (
  <img src={img} alt={title} className={css.image} key={imgIdx} />
))}
```

## Key Components in the Image Flow

### SearchPageWithMap.js
This is the main search page component that:
- Connects to the Redux store to get listings
- Passes listings to the SearchResultsPanel component

### SearchResultsPanel.js
This component:
- Receives listings as props
- Maps over listings and renders ListingCard components

### ListingCard.js
This component:
- Receives individual listings as props
- Extracts image URLs from the listing's image variants
- Displays images in a slider component

## Image Variant Configuration

Image variants are configured in the `loadData` function in `SearchPage.duck.js`:
```javascript
'fields.image': [
  'variants.scaled-small',
  'variants.scaled-medium',
  'variants.landscape-crop2x',
],
```

Custom image variants can also be created using the `createImageVariantConfig` utility:
```javascript
...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
```

## Photo Submission in Create/Edit Listing Form

### Image Selection and Upload
1. Users select images through the `FieldAddImageMultiple` component which uses the `react-dropzone` library
2. Users can either click to select files or drag and drop multiple images
3. Supported formats are JPG/PNG with a maximum size of 20MB each

### Image Upload Process
When a user selects images:
1. The `onImageUploadHandler` function in `EditListingPhotosForm.js` is triggered
2. This calls the `onImageUpload` prop which is connected to the Redux action `requestImageUpload`
3. In `EditListingPage.duck.js`, the `requestImageUpload` thunk:
   - Dispatches `uploadImageRequest` to update the Redux state with temporary image data
   - Calls `sdk.images.upload` to upload the image to the Sharetribe platform
   - On success, dispatches `uploadImageSuccess` with the real image ID from the platform
   - On error, dispatches `uploadImageError`

### Image State Management
- Uploaded images are stored in the Redux state under `uploadedImages`
- Images are tracked in order via `uploadedImagesOrder`
- The `pickRenderableImages` function in `EditListingPage.js` combines:
  - Existing listing images (for edit mode)
  - Newly uploaded images not yet attached to the listing
  - Excludes removed images

### Image Removal
- When a user removes an image, `onRemoveImage` is called
- This dispatches `removeListingImage` which:
  - Adds the image ID to `removedImageIds` (if it's an existing image)
  - Removes the image from `uploadedImages` and `uploadedImagesOrder`

### Form Submission
When the user submits the photos form:
1. The form values include an `images` array with image objects
2. In `EditListingPhotosPanel.js`, the form submission is handled:
   ```javascript
   onSubmit={values => {
     const { addImage, ...updateValues } = values;
     onSubmit(updateValues);
   }}
   ```
3. This calls the `onSubmit` prop which is connected to either:
   - `requestCreateListingDraft` (for new listings)
   - `requestUpdateListing` (for existing listings)

### Listing Creation/Update with Images
In `EditListingPage.duck.js`:
- For both create and update operations, the `imageIds` function extracts image IDs from the images array
- These IDs are included in the API call to `sdk.ownListings.createDraft` or `sdk.ownListings.update`
- The API expects an `images` array with just the image UUIDs, not the full image objects

### Key Implementation Details
- Images are uploaded individually as soon as they are selected, not when the form is submitted
- Temporary IDs are used during the upload process and replaced with real IDs from the platform
- The form tracks which images are attached to the listing vs. newly uploaded ones
- Removed images are handled by tracking their IDs separately

This approach allows for a smooth user experience where images are uploaded immediately and users can see previews, while still maintaining proper state management for the overall listing creation/editing flow.


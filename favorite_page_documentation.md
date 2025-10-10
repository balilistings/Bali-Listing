# Favorite Listings Page Documentation

## Overview
- Heart icon on listings toggles favorites
- Dedicated page to view/manage favorites  
- Bulk actions to remove multiple favorites
- Customer-only feature

## Main Components

### 1. Favorites Page (`FavoriteListingsPage.js`)
**Main Features:**
- Grid layout of favorite listings
- Checkbox selection for bulk actions
- Remove selected/all functionality

**Key Code:**
```jsx
// Bulk selection state
const [selectedIds, setSelectedIds] = useState([]);

// Toggle selection
const toggleSelect = id => {
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
};

// Remove selected favorites
const handleUnfavoriteSelected = async () => {
  if (selectedIds.length > 0) {
    for (const id of selectedIds) {
      await dispatch(unfavoriteListing(id));
    }
    setSelectedIds([]);
  }
};
```

**How the Bulk Selection Works:**
1. `useState([])` creates array to track selected listing IDs
2. `toggleSelect(id)` adds or removes ID from selection array
3. `handleUnfavoriteSelected()` loops through selected IDs and removes each
4. `setSelectedIds([])` clears selection after operation

### 2. Listing Card with Favorite Button (`ListingCard.js`)
**Favorite Toggle Logic:**
```jsx
// Check if current listing is favorited
const isFavorite = currentUser?.attributes.profile.privateData.favorites?.includes(id);

// Toggle favorite on click
const onToggleFavorites = e => {
  e.preventDefault();
  handleToggleFavorites({
    currentUser,
    params: { id },
  })(isFavorite);
};

// Heart button in render
<button
  className={`${css.wishlistButton} ${isFavorite ? css.active : ''}`}
  onClick={onToggleFavorites}
>
  <IconCollection name="icon-waislist" />
</button>
```

**How the Favorite Check Works:**
1. `currentUser?` - Safe navigation (no error if user is null)
2. `.attributes.profile.privateData.favorites` - Access favorites array in user profile
3. `.includes(id)` - Check if current listing ID exists in favorites
4. **Returns:** `true` if favorited, `false` if not

**Button Click Flow:**
1. User clicks heart button
2. `e.preventDefault()` stops default browser behavior
3. `handleToggleFavorites()` called with user data and listing ID
4. `isFavorite` passed to indicate current state (add or remove)

### 3. Navigation Integration
**Topbar Menu:**
```jsx
{checkIsCustomer(currentUser) && (
  <MenuItem key="FavoriteListingsPage">
    <NamedLink name="FavoriteListingsPage">
      <FormattedMessage id="Favorite Listings" />
    </NamedLink>
  </MenuItem>
)}
```

**How the Conditional Rendering Works:**
1. `checkIsCustomer(currentUser)` checks if user has customer role
2. **Returns:** `true` for customers, `false` for providers/guests
3. `&&` operator only renders component if condition is `true`
4. If `false`, React renders `null` (menu item hidden)

## Data Management

### Redux Actions (`FavoriteListingsPage.duck.js`)
**Fetch Favorites:**
```javascript
export const queryFavoriteListings = (queryParams) => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;
  const favorites = currentUser?.attributes?.profile?.privateData?.favorites || [];
  
  return sdk.listings.query({
    ids: favorites,
    include: ['images', 'author'],
    page: queryParams.page || 1,
    perPage: 42
  });
};
```

**How the Favorites Query Works:**
1. `getState().user` gets user data from Redux store
2. `currentUser` extracts current user object
3. `currentUser?.attributes?.profile?.privateData?.favorites` safely accesses favorites array
4. `|| []` provides empty array fallback if no favorites exist
5. `sdk.listings.query()` fetches full listing data for favorite IDs

**Remove Single Favorite:**
```javascript
export const unfavoriteListing = (listingId) => async (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;
  const favorites = currentUser.profile.privateData.favorites || [];
  const updatedFavorites = favorites.filter(id => id !== listingId);
  
  await sdk.currentUser.updateProfile({
    privateData: { favorites: updatedFavorites }
  });
};
```

**How Unfavorite Works:**
1. Get current favorites array from user profile
2. `favorites.filter(id => id !== listingId)` removes the specific listing ID
3. `sdk.currentUser.updateProfile()` saves updated favorites to database
4. Profile updated without listing ID

### User Type Checking (`userHelpers.js`)
```javascript
export const checkIsCustomer = currentUser => {
  return currentUser?.attributes?.profile?.publicData?.userType === 'customer';
};

export const checkIsProvider = currentUser => {
  return currentUser?.attributes?.profile?.publicData?.userType === 'provider';
};
```

**How User Type Check Works:**
1. `currentUser?` safely accesses user object
2. Navigates to `publicData.userType` in profile
3. Compares with `'customer'` or `'provider'` string
4. **Returns:** `true` if matches, `false` if not

## Favorite Toggle Logic (`userFavorites.js`)
```javascript
export const handleToggleFavorites = parameters => isFavorite => {
  const { currentUser, location, history, routes, params } = parameters;
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    history.push(createResourceLocatorString('LoginPage', routes, {}, {}));
    return;
  }
  
  // Get current favorites
  const { favorites = [] } = currentUser.attributes.profile.privateData || {};
  
  // Add or remove from favorites
  const updatedFavorites = isFavorite 
    ? favorites.filter(f => f !== params.id)
    : [...favorites, params.id];
  
  // Update user profile
  onUpdateFavorites({
    privateData: { favorites: updatedFavorites }
  });
};
```

**How Toggle Logic Works:**
1. **Check Authentication:** If no user, redirect to login page
2. **Get Current Favorites:** Extract favorites array from user profile
3. **Add/Remove Logic:**
   - If `isFavorite` is `true`: Remove listing ID (`filter`)
   - If `isFavorite` is `false`: Add listing ID (`spread operator`)
4. **Update Profile:** Save modified favorites array to user profile

## Data Storage Format
```javascript
// User profile structure
{
  attributes: {
    profile: {
      publicData: {
        userType: 'customer'  // or 'provider'
      },
      privateData: {
        favorites: [
          'listing-uuid-1', 
          'listing-uuid-2'
        ]
      }
    }
  }
}
```

**Data Structure Explanation:**
- `userType` determines access rights (customer vs provider)
- `favorites` array stores listing IDs as strings
- Stored in `privateData` for user privacy
- Simple array structure for easy management

## Key User Flows

### 1. Adding a Favorite
```
User clicks heart → Check login → Update profile → Refresh UI
     ↓               ↓              ↓              ↓
ListingCard → handleToggleFavorites → SDK update → State update
```

**Step-by-step Flow:**
1. **User Action:** Click heart icon on listing card
2. **Auth Check:** Verify user is logged in
3. **Data Update:** Add listing ID to favorites array
4. **UI Update:** Refresh heart icon to filled state

### 2. Viewing Favorites
```
Navigate to /favorites → Load user favorites → Query listings → Display grid
       ↓                    ↓                    ↓           ↓
Route change → Get IDs from profile → API call → Render cards
```

**Step-by-step Flow:**
1. **Navigation:** User visits `/favorites` page
2. **Data Fetch:** Get favorite IDs from user profile
3. **API Call:** Fetch full listing data for each ID
4. **Render:** Display listings in grid layout

### --- Thank You ---
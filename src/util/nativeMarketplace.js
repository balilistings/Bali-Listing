// Adapter for the existing React app. Presentation assets still use the public asset SDK.
export const nativeMarketplace = process.env.REACT_APP_NATIVE_MARKETPLACE === 'true';

export const nativeCall = async (path, { method = 'GET', body } = {}) => {
  const response = await window.fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data.error || response.statusText), {
      status: response.status,
      statusText: response.statusText,
      data: { errors: [{ status: response.status, code: 'native-marketplace' }] },
    });
  }
  return data;
};

const originalCategories = { rental: 'rentalvillas', sale: 'villaforsale', land: 'landforsale' };
const amounts = { weekly: 'weekprice', monthly: 'monthprice', yearly: 'yearprice' };
const idOf = id => id?.uuid || id;
const dateOf = value => value ? new Date(value) : undefined;
const permission = allowed => allowed ? 'permission/allow' : 'permission/deny';
const api = '/api/marketplace';

export function nativeSearchParams(params = {}) {
  const query = new URLSearchParams();
  const category = Object.keys(originalCategories).find(key =>
    originalCategories[key] === params.pub_categoryLevel1
  );
  if (category) query.set('category', category);
  if (params.keywords) query.set('q', params.keywords);
  if (params.address) query.set('area', params.address.split(',')[0].trim());
  if (/^\d+(,\d+)*$/.test(String(params.pub_bedrooms))) query.set('bedrooms', params.pub_bedrooms);
  if (['now', 'available-now'].includes(params.pub_availableper) || params.pub_available || params.pub_availableNow) {
    query.set('available', '1');
  }
  if (params.authorId) query.set('owner', idOf(params.authorId));
  if (params.ids) query.set('ids', params.ids);
  if (String(params.sort || '').includes('-price')) query.set('sort', 'price-desc');
  else if (String(params.sort || '').includes('price')) query.set('sort', 'price');

  const rent = Object.entries(amounts).find(([, field]) => params['pub_' + field]);
  const range = rent ? String(params['pub_' + rent[1]]) : params.price;
  if (range != null) {
    const [min, max] = String(range).split(',');
    if (rent) query.set('period', rent[0]);
    const divisor = rent ? 1 : 100;
    if (min && Number.isFinite(Number(min))) query.set('min', Math.ceil(Number(min) / divisor));
    if (max && Number.isFinite(Number(max))) query.set('max', Math.floor(Number(max) / divisor));
  }
  const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 24));
  query.set('limit', perPage);
  query.set('offset', Math.max(0, (Number(params.page) || 1) - 1) * perPage);
  return query;
}

export function createNativeMarketplaceSdk(presentationSdk, types, call = nativeCall) {
  const uuid = value => new types.UUID(value);
  const relation = (type, value) => ({ type, id: uuid(value) });
  const result = (data, included = [], meta = {}) => ({
    data: { data, included, meta: { publicReadFetchedAt: Date.now(), ...meta } },
  });
  const notEnabled = async () => { throw new Error('This operation is not enabled in the migration preview.'); };
  const user = (viewer, type = 'user') => ({
    ...relation(type, viewer.id),
    attributes: {
      ...(type === 'currentUser' ? { email: viewer.email, emailVerified: viewer.emailVerified } : {}),
      banned: false,
      deleted: false,
      state: 'active',
      profile: {
        displayName: viewer.name,
        abbreviatedName: viewer.name?.split(/\s+/).slice(0, 2).map(name => name.charAt(0)).join(''),
        bio: viewer.bio || '',
        publicData: { userType: viewer.role || 'provider' },
        protectedData: {},
      },
    },
  });
  const currentUser = viewer => {
    if (!viewer) throw Object.assign(new Error('Please log in.'), { status: 401 });
    const value = user(viewer, 'currentUser');
    const permissions = {
      ...relation('permissionSet', viewer.id),
      attributes: { postListings: permission(viewer.canPost), read: permission(viewer.canRead),
        initiateTransactions: permission(viewer.canRead) },
    };
    value.relationships = { effectivePermissionSet: { data: relation('permissionSet', viewer.id) } };
    return result(value, [permissions]);
  };
  const image = (photo, fields = []) => ({
    ...relation('image', photo.id),
    attributes: {
      variants: Object.fromEntries([...new Set([
        'default', 'landscape-crop', 'landscape-crop2x', 'listing-card', 'listing-card-2x',
        'scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge', 'featured-listing', ...fields,
      ])].map(name => [name, {
        name,
        url: photo.url,
        width: /2x|medium|large/.test(name) ? 1200 : 600,
        height: /2x|medium|large/.test(name) ? 800 : 400,
      }])),
    },
  });
  const listing = (row, params = {}, type = 'listing') => {
    const original = row.publicData || {};
    const prices = Object.fromEntries(Object.entries(amounts)
      .filter(([key]) => row.prices?.[key] != null).map(([key, field]) => [field, row.prices[key]]));
    const photos = row.photos || (row.cover ? [{ id: row.cover.split('/').pop(), url: row.cover }] : []);
    const fields = [].concat(params['fields.image'] || []).map(field => field.replace(/^variants\./, ''));
    const included = photos.map(photo => image(photo, fields));
    if (row.owner) included.push(user(row.owner));
    const amount = row.prices?.[row.pricePeriod];
    return {
      entity: {
        ...relation(type, row.id),
        attributes: {
          title: row.title,
          description: row.description,
          state: row.state || 'published',
          deleted: false,
          createdAt: dateOf(row.createdAt),
          price: amount == null ? null : new types.Money(amount * 100, 'IDR'),
          geolocation: row.coordinates ? new types.LatLng(row.coordinates.lat, row.coordinates.lng) : null,
          publicData: {
            listingType: 'free-listing',
            transactionProcessAlias: 'default-inquiry/release-1',
            unitType: 'inquiry',
            ...original,
            categoryLevel1: original.categoryLevel1 || originalCategories[row.category],
            ...(row.bedrooms == null ? {} : { bedrooms: String(row.bedrooms) }),
            location: { ...original.location, address: original.location?.address || row.area },
            area: row.area,
            ...prices,
            availableNow: row.confirmedAt ? 'yes' : original.availableNow,
            nativeContact: row.hasContact === true,
          },
        },
        relationships: {
          images: { data: photos.map(photo => relation('image', photo.id)) },
          author: { data: row.owner ? relation('user', row.owner.id) : null },
        },
      },
      included,
    };
  };
  const listings = (rows, params, meta, type) => {
    const values = rows.map(row => listing(row, params, type));
    const included = new Map(values.flatMap(value => value.included).map(entity =>
      [entity.type + ':' + entity.id.uuid, entity]
    ));
    return result(values.map(value => value.entity), [...included.values()], meta);
  };
  const show = async (params, type) => {
    const row = await call(api + '/listings/' + encodeURIComponent(idOf(params.id)));
    const value = listing(row, params, type);
    return result(value.entity, value.included);
  };
  const session = () => call('/api/auth/session');
  const post = (path, body) => call(path, { method: 'POST', body });

  return {
    nativeMarketplace: true,
    // Only immutable public assets use the legacy SDK in the staging build.
    assetByAlias: params => presentationSdk.assetByAlias(params),
    assetByVersion: params => presentationSdk.assetByVersion(params),
    assetsByAlias: params => presentationSdk.assetsByAlias(params),
    assetsByVersion: params => presentationSdk.assetsByVersion(params),
    authInfo: async () => ({ isAnonymous: !(await session()).account }),
    login: ({ username, password }) => post('/api/auth/login', { email: username, password }),
    logout: () => post('/api/auth/logout', {}),
    currentUser: {
      show: async () => currentUser((await session()).account),
      create: ({ email, firstName, lastName, publicData }) => post('/api/auth/signup', {
        email, name: [firstName, lastName].filter(Boolean).join(' '), role: publicData?.userType, accepted: true,
      }),
      updateProfile: async ({ displayName, firstName, lastName, bio }) => {
        const { account } = await session();
        await call(api + '/profile', { method: 'PATCH', body: {
          name: displayName || [firstName, lastName].filter(Boolean).join(' ') || account.name,
          bio: bio ?? account.bio,
        } });
        return currentUser((await session()).account);
      },
      sendVerificationEmail: notEnabled,
    },
    passwordReset: {
      request: ({ email }) => post('/api/auth/recovery', { email }),
      reset: ({ passwordResetToken, newPassword }) => post('/api/auth/password', {
        token: passwordResetToken, password: newPassword,
      }),
    },
    listings: {
      query: async params => {
        const { listings: rows, total, nextOffset } = await call(api + '/listings?' + nativeSearchParams(params));
        const perPage = Math.min(100, Math.max(1, Number(params?.perPage) || 24));
        return listings(rows, params, {
          page: Number(params?.page || 1), perPage, totalItems: total ?? rows.length,
          totalPages: total == null ? (nextOffset ? Number(params?.page || 1) + 1 : 1) : Math.ceil(total / perPage),
        });
      },
      show,
    },
    ownListings: {
      query: async params => {
        const { listings: rows } = await call(api + '/mine');
        const perPage = Number(params?.perPage) || 24;
        const page = Number(params?.page) || 1;
        const states = Array.isArray(params?.states) ? params.states : String(params?.states || '').split(',').filter(Boolean);
        const matches = states.length ? rows.filter(row => states.includes(row.state)) : rows;
        return listings(matches.slice((page - 1) * perPage, page * perPage), params, {
          page, perPage, totalItems: matches.length, totalPages: Math.ceil(matches.length / perPage),
        }, 'ownListing');
      },
      show: params => show(params, 'ownListing'),
      close: ({ id }) => post(api + '/listings/' + idOf(id) + '/close', {}),
      open: ({ id }) => post(api + '/listings/' + idOf(id) + '/publish', {}),
    },
    users: { show: async ({ id }) => result(user(await call(api + '/profiles/' + idOf(id)))) },
    reviews: { query: async () => result([]) },
    transactions: { query: async () => result([]), initiate: notEnabled },
    timeslots: { query: async () => result([]) },
  };
}

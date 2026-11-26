// Adapter for the existing React app. Presentation assets still use the public asset SDK.
export const nativeMarketplace = process.env.REACT_APP_NATIVE_MARKETPLACE === 'true';

export const nativeCall = async (path, { method = 'GET', body, raw = false } = {}) => {
  const response = await window.fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': raw ? (body.type || 'application/octet-stream') : 'application/json' },
      body: raw ? body : JSON.stringify(body),
    }),
  });
  const data = await response.json().catch(error => {
    if (response.ok) throw error;
    return {};
  });
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
const listingPath = id => api + '/listings/' + encodeURIComponent(idOf(id));

function editorValues({ title, description, publicData, privateData, geolocation, price }) {
  const values = { wizard: true, title, description, publicData, privateData };
  const category = Object.keys(originalCategories).find(key => originalCategories[key] === publicData?.categoryLevel1);
  if (category) values.category = category;
  if (publicData && Object.hasOwn(publicData, 'bedrooms')) {
    const bedrooms = parseInt(publicData.bedrooms, 10);
    values.bedrooms = Number.isFinite(bedrooms) ? bedrooms : null;
  }
  if (publicData && Object.hasOwn(publicData, 'phonenumber')) values.phone = publicData.phonenumber;
  if (publicData?.location?.address) values.area = publicData.location.address;
  if (geolocation) values.coordinates = { lat: geolocation.lat, lng: geolocation.lng };
  if (Array.isArray(publicData?.pricee)) {
    values.prices = Object.fromEntries(publicData.pricee.filter(period => amounts[period])
      .map(period => [period, publicData[amounts[period]]]));
  } else if (price) {
    values.prices = { total: price.amount / 100 };
  }
  return values;
}

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
  let configSnapshot;
  const loadSnapshotAsset = async ({ path }) => {
    const name = String(path || '').match(/^\/?content\/pages\/([a-z0-9][a-z0-9-]{0,190})\.json$/i)?.[1];
    if (!name) throw Object.assign(new Error('Page not found.'), { status: 404 });
    return { data: await call('/static/presentation/pages/' + name + '.json') };
  };
  const loadSnapshotConfig = async ({ paths }) => {
    configSnapshot ??= call('/static/presentation/config.json').catch(error => {
      configSnapshot = undefined;
      throw error;
    });
    const snapshot = await configSnapshot;
    const pathsWanted = new Set(paths.map(path => path.startsWith('/') ? path : '/' + path));
    return { data: { ...snapshot, data: snapshot.data.filter(asset =>
      pathsWanted.has(asset.attributes?.assetPath)), included: snapshot.included || [] } };
  };
  const useSnapshot = process.env.REACT_APP_NATIVE_ASSET_SNAPSHOT === 'true';
  const uuid = value => new types.UUID(value);
  const relation = (type, value) => ({ type, id: uuid(value) });
  const result = (data, included = [], meta = {}) => ({
    data: { data, included, meta: { publicReadFetchedAt: Date.now(), ...meta } },
  });
  const notEnabled = async () => { throw new Error('This operation is not enabled in the migration preview.'); };
  const user = (viewer, type = 'user') => ({
    ...relation(type, viewer.id),
    attributes: {
      ...(type === 'currentUser' ? {
        email: viewer.email, emailVerified: viewer.emailVerified, pendingEmail: viewer.pendingEmail,
      } : {}),
      banned: false,
      deleted: false,
      state: 'active',
      profile: {
        displayName: viewer.name,
        abbreviatedName: viewer.abbreviatedName ||
          viewer.name?.split(/\s+/).slice(0, 2).map(name => name.charAt(0)).join(''),
        ...(type === 'currentUser' ? { firstName: viewer.firstName || '', lastName: viewer.lastName || '' } : {}),
        bio: viewer.bio || '',
        metadata: {},
        publicData: { userType: viewer.role || 'provider' },
        protectedData: type === 'currentUser' ? { locale: viewer.locale, phoneNumber: viewer.phoneNumber } : {},
        ...(type === 'currentUser' ? { privateData: {} } : {}),
      },
    },
    ...(viewer.profilePhotoId ? { relationships: {
      profileImage: { data: relation('image', viewer.profilePhotoId) },
    } } : {}),
  });
  const currentUser = viewer => {
    if (!viewer) throw Object.assign(new Error('Please log in.'), { status: 401 });
    const value = user(viewer, 'currentUser');
    const permissions = {
      ...relation('permissionSet', viewer.id),
      attributes: { postListings: permission(viewer.canPost), read: permission(viewer.canRead),
        initiateTransactions: permission(viewer.canRead) },
    };
    value.relationships = { ...value.relationships, effectivePermissionSet: { data: relation('permissionSet', viewer.id) } };
    return result(value, [permissions, ...userImages(viewer)]);
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
  const userImages = viewer => viewer.profilePhotoId ? [image({
    id: viewer.profilePhotoId, url: '/api/media/profile/' + viewer.profilePhotoId,
  }, ['square-small', 'square-small2x', 'square-xsmall', 'square-xsmall2x'])] : [];
  const listing = (row, params = {}, type = 'listing') => {
    const original = row.publicData || {};
    const prices = Object.fromEntries(Object.entries(amounts)
      .filter(([key]) => row.prices?.[key] != null).map(([key, field]) => [field, row.prices[key]]));
    const photos = row.photos || (row.cover ? [{ id: row.cover.split('/').pop(), url: row.cover }] : []);
    const fields = [].concat(params['fields.image'] || []).map(field => field.replace(/^variants\./, ''));
    const included = photos.map(photo => image(photo, fields));
    if (row.owner) included.push(user(row.owner), ...userImages(row.owner));
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
          metadata: row.metadata || {},
          price: row.sourcePrice
            ? new types.Money(row.sourcePrice.amount, row.sourcePrice.currency)
            : amount == null ? null : new types.Money(amount * 100, 'IDR'),
          geolocation: row.coordinates ? new types.LatLng(row.coordinates.lat, row.coordinates.lng) : null,
          publicData: {
            listingType: 'free-listing',
            transactionProcessAlias: 'default-inquiry/release-1',
            unitType: 'inquiry',
            ...original,
            categoryLevel1: original.categoryLevel1 || originalCategories[row.category],
            ...(row.bedrooms == null ? {} : { bedrooms: original.bedrooms ?? String(row.bedrooms) }),
            location: { ...original.location, address: original.location?.address || row.area },
            area: row.area,
            ...prices,
            ...(row.category === 'rental' ? { pricee: Object.keys(amounts).filter(period =>
              row.prices?.[period] != null
            ) } : {}),
            availableNow: row.confirmedAt ? 'yes' : original.availableNow,
            nativeContact: row.hasContact === true,
            ...(row.reference ? { referenceCode: row.reference } : {}),
            ...(type === 'ownListing' && row.phone ? { phonenumber: '+' + row.phone } : {}),
          },
          ...(type === 'ownListing' ? { privateData: {
            ...row.privateData, blAvailabilityConfirmedAt: row.confirmedAt,
          } } : {}),
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
  const galleries = new Map();
  let draftRequestKey;
  const show = async (params, type) => {
    const row = await call(listingPath(params.id));
    if (type === 'ownListing') {
      if (!row.canManage) throw Object.assign(new Error('Listing not found.'), { status: 404 });
      galleries.set(row.id, row.photos.map(photo => photo.id));
    }
    const value = listing(row, params, type);
    return result(value.entity, value.included);
  };
  const session = () => call('/api/auth/session');
  const post = (path, body) => call(path, { method: 'POST', body });
  const changeState = (params, action, query) => post(listingPath(params.id) + '/' + action, {})
    .then(() => show({ ...query, ...params }, 'ownListing'));

  return {
    nativeMarketplace: true,
    // Only immutable public assets use the legacy SDK in the staging build.
    assetByAlias: useSnapshot ? loadSnapshotAsset : params => presentationSdk.assetByAlias(params),
    assetByVersion: useSnapshot ? loadSnapshotAsset : params => presentationSdk.assetByVersion(params),
    assetsByAlias: useSnapshot ? loadSnapshotConfig : params => presentationSdk.assetsByAlias(params),
    assetsByVersion: useSnapshot ? loadSnapshotConfig : params => presentationSdk.assetsByVersion(params),
    authInfo: async () => ({ isAnonymous: !(await session()).account }),
    login: ({ username, password }) => post('/api/auth/login', { email: username, password }),
    logout: () => post('/api/auth/logout', {}),
    currentUser: {
      show: async () => currentUser((await session()).account),
      create: ({ email, firstName, lastName, publicData }) => post('/api/auth/signup', {
        email, name: [firstName, lastName].filter(Boolean).join(' '), role: publicData?.userType, accepted: true,
      }),
      updateProfile: async ({ displayName, firstName, lastName, bio, protectedData, profileImageId }) => {
        const { account } = await session();
        await call(api + '/profile', { method: 'PATCH', body: {
          name: displayName || [firstName, lastName].filter(Boolean).join(' ') || account.name,
          firstName, lastName, bio, locale: protectedData?.locale, phoneNumber: protectedData?.phoneNumber,
          ...(profileImageId === undefined ? {} : { profilePhotoId: idOf(profileImageId) }),
        } });
        return currentUser((await session()).account);
      },
      changePassword: ({ currentPassword, newPassword }) =>
        post('/api/auth/change-password', { currentPassword, newPassword }),
      changeEmail: async ({ email, currentPassword }) => {
        await post('/api/auth/change-email', { email, currentPassword });
        return currentUser((await session()).account);
      },
      sendVerificationEmail: () => post('/api/auth/resend-email-change', {}),
      verifyEmail: ({ verificationToken }) => post('/api/auth/confirm-email-change', { token: verificationToken }),
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
      show: (params, query) => show({ ...query, ...params }, 'ownListing'),
      createDraft: async (values, query) => {
        draftRequestKey ||= window.crypto.randomUUID();
        const { id } = await post(api + '/listings', { ...editorValues(values), requestKey: draftRequestKey });
        const response = await show({ ...query, id }, 'ownListing');
        draftRequestKey = undefined;
        return response;
      },
      update: async (values, query) => {
        const { id, images } = values;
        const path = listingPath(id);
        if (images) {
          await call(path + '/photos', { method: 'PUT', body: {
            ids: images.map(idOf), previousIds: galleries.get(idOf(id)), wizard: true,
          } });
        } else {
          await call(path, { method: 'PATCH', body: editorValues(values) });
        }
        return show({ ...query, id }, 'ownListing');
      },
      publishDraft: (params, query) => changeState(params, 'publish', query),
      close: (params, query) => changeState(params, 'close', query),
      open: (params, query) => changeState(params, 'publish', query),
      discardDraft: ({ id }) => post(listingPath(id) + '/discard', {}),
    },
    images: {
      upload: async ({ image: file, listingId }, query) => {
        const path = listingId ? listingPath(listingId) + '/photos' : api + '/profile/photo';
        const photo = await call(path, { method: 'POST', body: file, raw: true });
        const gallery = listingId ? galleries.get(idOf(listingId)) : null;
        if (gallery) gallery[photo.position] = photo.id;
        const variants = [].concat(query?.['fields.image'] || []).map(field => field.replace(/^variants\./, ''));
        return result(image(photo, variants));
      },
    },
    users: { show: async ({ id }) => {
      const profile = await call(api + '/profiles/' + idOf(id));
      return result(user(profile), userImages(profile));
    } },
    reviews: { query: async () => result([]) },
    transactions: { query: async () => result([]), initiate: notEnabled },
    timeslots: { query: async () => result([]) },
  };
}

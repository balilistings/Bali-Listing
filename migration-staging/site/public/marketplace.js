'use strict';

const main = document.getElementById('main');
const page = new URL(location.href);
const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const labels = { rental: 'Rentals', sale: 'Property for sale', land: 'Land for sale' };
const periodLabels = { weekly: 'per week', monthly: 'per month', yearly: 'per year', total: '' };
const stateLabels = { published: 'Published', draft: 'Draft', closed: 'Closed', pendingApproval: 'Pending approval' };
const formNotice = '<p class="notice" role="status" aria-live="polite"></p>';
let session;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
const e = escapeHtml;
const property = id => '/l/' + encodeURIComponent(id);
const market = '/api/marketplace';
const loginForPage = () => '/login?' + new URLSearchParams({ next: page.pathname + page.search });

async function api(path, options = {}) {
  const request = { method: options.method || 'GET' };
  if (options.body instanceof Blob) request.body = options.body;
  else if (options.body !== undefined) {
    request.headers = { 'Content-Type': 'application/json' };
    request.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, request);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Try again in a moment.');
  return result;
}

function show(content, title) {
  document.title = title + ' | Bali Listings';
  main.innerHTML = content;
}
function section(content) {
  return '<section class="shell section">' + content + '</section>';
}
function notice(container, message, error = false) {
  const element = container.querySelector('.notice');
  if (!element) return;
  element.textContent = message;
  element.dataset.error = String(error);
}
function bindSubmit(form, operation) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const buttons = [...form.querySelectorAll('button')].filter(button => !button.disabled);
    buttons.forEach(button => { button.disabled = true; });
    notice(form, '');
    try {
      await operation(new FormData(form), event.submitter);
    } catch (error) {
      notice(form, error.message, true);
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  });
}

function options(entries, selected, blank) {
  const list = Object.entries(entries).map(([value, label]) =>
    `<option value="${e(value)}"${value === selected ? ' selected' : ''}>${e(label)}</option>`).join('');
  return (blank ? `<option value="">${e(blank)}</option>` : '') + list;
}

function priceText(listing, preferred) {
  const period = listing.prices?.[preferred] ? preferred : listing.pricePeriod;
  const value = listing.prices?.[period];
  return value ? 'IDR ' + money.format(value) + (periodLabels[period] ? ' ' + periodLabels[period] : '') : '';
}

function card(listing, period) {
  return `<article class="card"><a href="${property(listing.id)}">
    ${listing.cover ? `<img src="${e(listing.cover)}" alt="" loading="lazy">` : '<div class="no-photo" aria-hidden="true"></div>'}
    <div class="card-info"><h3>${e(listing.title)}</h3>
    <p class="meta">${e([listing.area, listing.bedrooms == null ? '' : listing.bedrooms + ' bedrooms', listing.reference].filter(Boolean).join(' · '))}</p>
    <p class="price">${e(priceText(listing, period))}</p></div></a></article>`;
}

function catalog(listings, period) {
  return listings.length ? '<div class="results">' + listings.map(listing => card(listing, period)).join('') + '</div>'
    : '<p class="lede">No properties match these filters.</p>';
}

async function home() {
  const { listings } = await api(market + '/listings');
  const first = listings.find(listing => listing.cover);
  const actions = Object.entries(labels).map(([category, label], index) =>
    `<a class="button${index ? ' secondary' : ''}" href="/s?category=${category}">${e(label)}</a>`).join('');
  show(`<section class="hero"><div class="shell hero-inner">
    <div><h1>Find your place in Bali</h1><p>Browse homes and land across Bali and contact owners directly.</p>
    <div class="actions">${actions}</div></div>
    ${first ? `<img src="${e(first.cover)}" alt="${e(first.title)}" fetchpriority="high">` : ''}
    </div></section>` + section('<h2>Recent listings</h2>' + catalog(listings.slice(0, 6))), 'Find property in Bali');
}

async function search() {
  const filters = new URLSearchParams(page.search);
  const oldCategories = { rentalvillas: 'rental', villaforsale: 'sale', landforsale: 'land' };
  if (!filters.has('category') && oldCategories[filters.get('pub_categoryLevel1')]) {
    filters.set('category', oldCategories[filters.get('pub_categoryLevel1')]);
  }
  const value = key => e(filters.get(key));
  const filterForm = `<form class="filters" action="/s" aria-label="Listing filters">
    <label class="wide">Keyword or reference<input name="q" value="${value('q')}"></label>
    <label>Property category<select name="category">${options(labels, filters.get('category'), 'All')}</select></label>
    <label>Area<input name="area" value="${value('area')}" placeholder="e.g. Kerobokan"></label>
    <label>Bedrooms<input name="bedrooms" type="number" min="0" max="99" value="${value('bedrooms')}"></label>
    <label>Price period<select name="period">${options({ weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', total: 'Total' }, filters.get('period'), 'Any')}</select></label>
    <label>Min price in IDR<input name="min" type="number" min="0" value="${value('min')}"></label>
    <label>Max price in IDR<input name="max" type="number" min="0" value="${value('max')}"></label>
    <label class="check wide"><input name="available" value="1" type="checkbox"${filters.get('available') === '1' ? ' checked' : ''}>Recently confirmed available</label>
    <label>Sort by<select name="sort">${options({ recent: 'Newest', price: 'Lowest price' }, filters.get('sort'))}</select></label>
    <div class="actions"><button>Search</button><a href="/s">Clear</a></div></form>`;
  show(section('<h1>Browse listings</h1>' + filterForm + '<div id="search-results"></div>'), 'Browse listings');
  try {
    const result = await api(market + '/listings?' + filters);
    const next = new URLSearchParams(filters);
    if (result.nextOffset !== null) next.set('offset', result.nextOffset);
    document.getElementById('search-results').innerHTML = catalog(result.listings, filters.get('period')) +
      (result.nextOffset === null ? '' : `<a class="button secondary" href="/s?${e(next)}">Next listings</a>`);
  } catch (error) {
    document.getElementById('search-results').textContent = error.message;
  }
}

async function listingPage(id) {
  const listing = await api(market + '/listings/' + encodeURIComponent(id));
  const message = '<p class="notice" role="status"></p>';
  const contact = listing.hasContact
    ? session.account ? '<button id="contact">Contact on WhatsApp</button>'
      : `<a class="button" href="${e(loginForPage())}">Log in to contact</a>`
    : '';
  show(section(`<a href="/s">Browse listings</a><h1>${e(listing.title)}</h1>
    <p class="meta">${e([listing.area, labels[listing.category], listing.bedrooms == null ? '' : listing.bedrooms + ' bedrooms',
      listing.reference].filter(Boolean).join(' · '))}</p>
    <div class="gallery">${listing.photos.map((photo, i) => `<img src="${e(photo.url)}" alt="${e(listing.title)} photo ${i + 1}"${i ? ' loading="lazy"' : ''}>`).join('')}</div>
    <div class="details"><div class="stack"><h2>About this property</h2><p>${e(listing.description)}</p></div>
    <aside class="side"><h3>Price</h3>${Object.keys(listing.prices || {}).map(period => `<p class="price">${e(priceText(listing, period))}</p>`).join('')}
    <a href="/u/${e(listing.owner.id)}">${e(listing.owner.name)}</a>
    ${listing.confirmedAt ? `<p class="meta">Availability confirmed ${e(new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Makassar' }).format(new Date(listing.confirmedAt)))}</p>` : ''}
    ${contact}${listing.canManage ? `<a href="${property(id)}/edit">Edit listing</a>` : ''}${message}</aside></div>`), listing.title);
  document.getElementById('contact')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await api(market + '/listings/' + encodeURIComponent(id) + '/contact');
      const url = new URL(result.url);
      if (url.origin !== 'https://wa.me') throw new Error('The contact address is unavailable.');
      location.assign(url.href);
    } catch (error) {
      notice(main, error.message, true);
      button.disabled = false;
    }
  });
}

async function publicProfile(id) {
  const profile = await api(market + '/profiles/' + encodeURIComponent(id));
  show(section(`<h1>${e(profile.name)}</h1>${profile.bio ? `<p class="lede">${e(profile.bio)}</p>` : ''}
    <h2>Listings</h2>${catalog(profile.listings)}`), profile.name);
}

function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/';
  const dest = new URL(value, location.origin);
  return dest.origin === location.origin ? dest.pathname + dest.search : '/';
}

function requireAccount(provider = false) {
  if (!session.account) {
    location.assign(loginForPage());
    return false;
  }
  if (provider && !session.account.canPost) throw new Error('A provider account is required to create a listing.');
  return true;
}

function authPage(action) {
  const signup = action === 'signup';
  const login = action === 'login';
  const setup = action === 'setup';
  const title = { signup: 'Create an account', login: 'Log in', recovery: 'Recover your account', setup: 'Set your password' }[action];
  const role = page.pathname.split('/')[2] || '';
  const google = session.googleEnabled && (signup || login);
  let emailToken;
  if (setup) {
    emailToken = page.hash.slice(1);
    if (emailToken) history.replaceState(null, '', page.pathname);
  }
  const email = setup ? '' : '<label>Email address<input name="email" type="email" maxlength="254" autocomplete="email"></label>';
  const pw = !(setup || login) ? '' :
    `<label>Password<input name="password" type="password" maxlength="128" ${setup ? 'minlength="12"' : ''} autocomplete="${setup ? 'new-password' : 'current-password'}"></label>`;
  const start = signup ? `<label>Name<input name="name" maxlength="100" autocomplete="name"></label>
    <label>Account type<select name="role">${options({ customer: 'Customer', provider: 'Provider' }, role, 'Choose one')}</select></label>
    <label class="check"><input type="checkbox" name="accepted" value="true"> I accept the Terms and Privacy Policy linked below.</label>` : '';
  show(section(`<h1>${title}</h1><form class="form narrow" id="account-form" novalidate>${start}${email}${pw}
    <div class="actions"><button value="email">${setup ? 'Save password' : login ? 'Log in' : 'Email me a link'}</button>
      ${google ? '<button class="secondary" value="google">Continue with Google</button>' : ''}</div>
    ${formNotice}</form>
    <div class="actions">${login ? '<a href="/signup">Create an account</a> · <a href="/account/recovery">Forgot password?</a>'
      : '<a href="/login">Back to login</a>'}</div>`), title);
  const form = document.getElementById('account-form');
  if (page.searchParams.has('error')) notice(form, page.searchParams.get('error'), true);
  else if ((signup || action === 'recovery') && !session.emailEnabled) notice(form, 'Email delivery is unavailable on this preview.');
  bindSubmit(form, async (data, button) => {
    const info = Object.fromEntries(data);
    info.accepted = info.accepted === 'true';
    if (button?.value === 'google') {
      const result = await api('/api/auth/google', { method: 'POST', body: {
        role: signup ? info.role : undefined, accepted: info.accepted, next: page.searchParams.get('next'),
      } });
      location.assign(result.url);
      return;
    }
    if (setup) info.token = emailToken;
    const result = await api('/api/auth/' + (setup ? 'password' : action), { method: 'POST', body: info });
    if (setup || login) location.assign(safeReturn(page.searchParams.get('next')));
    else notice(form, result.message);
  });
}

function listingFields(listing = {}) {
  const category = listing.category || 'rental';
  return `<label>Title<input name="title" required maxlength="160" value="${e(listing.title)}"></label>
    <div class="fields">
      <label>Property category<select name="category">${options(labels, category)}</select></label>
      <label>Area<input name="area" required maxlength="100" value="${e(listing.area)}" placeholder="e.g. Kerobokan"></label>
      <label data-bedrooms>Bedrooms<input name="bedrooms" type="number" min="0" max="99" value="${e(listing.bedrooms)}"></label>
      <label>WhatsApp number<input name="phone" type="tel" maxlength="40" value="${e(listing.phone)}" placeholder="+62"></label>
      ${Object.entries({ weekly: 'Weekly price', monthly: 'Monthly price', yearly: 'Yearly price', total: 'Total asking price' }).map(([key, label]) =>
        `<label data-period="${key}">${label} in IDR<input name="${key}" type="number" min="1" value="${e(listing.prices?.[key])}"></label>`).join('')}
    </div><label>Description<textarea name="description" maxlength="10000" required>${e(listing.description)}</textarea></label>`;
}

function editorPayload(data) {
  return { title: data.get('title'), category: data.get('category'), area: data.get('area'), phone: data.get('phone'),
    bedrooms: data.get('bedrooms'), description: data.get('description'),
    prices: Object.fromEntries(Object.keys(periodLabels).map(key => [key, data.get(key)])) };
}

async function editor(id) {
  if (!requireAccount(!id)) return;
  const route = id ? market + '/listings/' + encodeURIComponent(id) : market + '/listings';
  const listing = id ? await api(route) : {};
  if (id && !listing.canManage) throw new Error('Only the owner can edit this listing.');
  const title = id ? 'Edit listing' : 'Add a listing';
  const photos = listing.photos || [];
  const state = listing.state;
  const canPublish = id && (session.account.canPost || session.account.staff);
  const photoList = photos.map((photo, index) => `<div><img src="${e(photo.url)}" alt="Photo ${index + 1}">
    <div class="actions">${index ? `<button class="secondary" type="button" data-cover="${e(photo.id)}">Make cover</button>` : ''}
    <button class="secondary" type="button" data-remove="${e(photo.id)}">Remove</button></div></div>`).join('');
  show(section(`<h1>${title}</h1>
    ${id ? `<p class="lede">${e(stateLabels[state])}${listing.reference ? ' · ' + e(listing.reference) : ''}</p>` : ''}
    <form class="form" id="listing-form">${listingFields(listing)}
      <div class="actions"><button>${id ? 'Save listing' : 'Save draft'}</button>${id ? `<a href="${property(id)}">View listing</a>` : ''}</div>${formNotice}</form>
    ${id ? `<section class="stack" id="listing-actions"><h2>Photos</h2>
      <div class="photo-list">${photoList}</div>
      ${photos.length < 10 ? '<label>Add photos<input type="file" id="photos" accept="image/jpeg,image/png,image/webp" multiple></label>' : ''}
      <div class="actions">
      ${canPublish && state !== 'published' ? '<button data-state="publish">Publish</button>' : ''}
      ${state === 'pendingApproval' && session.account.staff ? '<button data-state="approve">Approve</button>' : ''}
      ${state === 'published' ? '<button data-state="availability">Confirm availability</button>' : ''}
      ${['published', 'pendingApproval'].includes(state) ? '<button class="secondary" data-state="close">Close listing</button>' : ''}
      </div>${formNotice}</section>` : ''}`), title);
  const form = document.getElementById('listing-form');
  function syncFields() {
    const rental = form.elements.category.value === 'rental';
    const bedroom = form.querySelector('[data-bedrooms]');
    bedroom.hidden = form.elements.category.value === 'land';
    bedroom.querySelector('input').disabled = bedroom.hidden;
    for (const input of form.querySelectorAll('[data-period]')) {
      input.hidden = rental === (input.dataset.period === 'total');
      input.querySelector('input').disabled = input.hidden;
    }
  }
  form.elements.category.addEventListener('change', syncFields);
  syncFields();
  const keyName = 'marketplace-draft-' + session.account.id;
  const requestKey = id ? null : sessionStorage.getItem(keyName) || crypto.randomUUID();
  if (!id) sessionStorage.setItem(keyName, requestKey);
  bindSubmit(form, async data => {
    const body = editorPayload(data);
    if (!id) body.requestKey = requestKey;
    const saved = await api(route, { method: id ? 'PATCH' : 'POST', body });
    if (id) notice(form, 'Listing saved.');
    else {
      sessionStorage.removeItem(keyName);
      location.assign(property(saved.id) + '/edit');
    }
  });
  const controls = document.getElementById('listing-actions');
  if (!controls) return;
  async function change(task) {
    try {
      await task();
      location.reload();
    } catch (error) {
      notice(controls, error.message, true);
    }
  }
  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    button.disabled = true;
    void change(async () => {
      if (button.dataset.state) {
        await api(route + '/' + button.dataset.state, { method: 'POST' });
      } else {
        const selected = button.dataset.cover || button.dataset.remove;
        const others = photos.filter(photo => photo.id !== selected).map(photo => photo.id);
        await api(route + '/photos', { method: 'PUT', body: {
          ids: button.dataset.cover ? [selected, ...others] : others,
          previousIds: photos.map(photo => photo.id),
        } });
      }
    }).finally(() => { button.disabled = false; });
  });
  controls.querySelector('#photos')?.addEventListener('change', event => {
    const input = event.currentTarget;
    input.disabled = true;
    void change(async () => {
      const files = [...input.files];
      if (files.length + photos.length > 10) throw new Error('A listing can have up to 10 photos.');
      for (const file of files) await api(route + '/photos', { method: 'POST', body: file });
    }).finally(() => { input.disabled = false; });
  });
}

async function manage(moderation = false) {
  if (!requireAccount()) return;
  const { listings } = await api(market + (moderation ? '/moderation' : '/mine'));
  const title = moderation ? 'Listing moderation' : 'Your listings';
  show(section(`<div class="page-title"><h1>${title}</h1>${!moderation && session.account.canPost ? '<a class="button" href="/l/new">Add a listing</a>' : ''}</div>
    ${listings.length ? '<ul class="items">' + listings.map(listing =>
      `<li><div><h3>${e(listing.title)}</h3><p class="meta">${e(stateLabels[listing.state])}${listing.reference ? ' · ' + e(listing.reference) : ''}</p></div>
        <a href="${property(listing.id)}/edit">${moderation ? 'Review' : 'Edit listing'}</a></li>`).join('') + '</ul>'
      : '<p class="lede">There are no listings here yet.</p>'}`), title);
}

function editProfile() {
  if (!requireAccount()) return;
  show(section(`<h1>Profile settings</h1><form id="profile-form" class="form narrow">
    <label>Name<input name="name" required maxlength="100" value="${e(session.account.name)}"></label>
    <label>Bio<textarea name="bio" maxlength="2000">${e(session.account.bio)}</textarea></label><div><button>Save profile</button></div>${formNotice}</form>`),
  'Profile settings');
  const form = document.getElementById('profile-form');
  bindSubmit(form, async data => {
    await api(market + '/profile', { method: 'PATCH', body: Object.fromEntries(data) });
    notice(form, 'Profile saved.');
  });
}

async function start() {
  session = await api('/api/auth/session');
  const nav = document.getElementById('account-nav');
  if (session.account) {
    nav.innerHTML = `<a href="/listings">Your listings</a> · <a href="/profile-settings">Profile</a>
      ${session.account.staff ? ' · <a href="/moderation">Moderation</a>' : ''}
      · <button class="secondary" id="logout">Log out</button>`;
    document.getElementById('logout').addEventListener('click', async event => {
      try {
        await api('/api/auth/logout', { method: 'POST' });
        location.assign('/');
      } catch (error) { event.target.textContent = error.message; }
    });
  }
  const [, first, second, third] = page.pathname.split('/');
  if (!first) await home();
  else if (first === 's') await search();
  else if (first === 'signup' || first === 'login') authPage(first);
  else if (first === 'account') authPage(second);
  else if (first === 'listings' || first === 'moderation') await manage(first === 'moderation');
  else if (first === 'profile-settings') editProfile();
  else if (first === 'u') await publicProfile(second);
  else if (first === 'l' && (second === 'new' || third === 'edit')) await editor(second === 'new' ? null : second);
  else if (first === 'l') await listingPage(third || second);
}

start().catch(error => show(section(`<h1>Unable to load this page</h1><p class="lede">${e(error.message)}</p><a href="/s">Browse listings</a>`),
  'Bali Listings'));

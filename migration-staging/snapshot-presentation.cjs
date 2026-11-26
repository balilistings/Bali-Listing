'use strict';

const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, join, resolve } = require('node:path');
const { digest } = require('./site/common.cjs');

const configEntries = [
  'content/translations.json', 'content/footer.json', 'content/top-bar.json',
  'design/branding.json', 'design/layout.json', 'users/user-types.json', 'users/user-fields.json',
  'listings/listing-categories.json', 'listings/listing-types.json', 'listings/listing-fields.json',
  'listings/listing-search.json', 'transactions/minimum-transaction-size.json',
  'integrations/analytics.json', 'integrations/google-search-console.json', 'integrations/map.json',
  'general/localization.json', 'general/access-control.json',
];
const corePages = ['landing-page', 'services', 'about', 'contactus', 'faq', 'blog', 'terms-of-service', 'privacy-policy'];
const requiredConfigs = ['/design/branding.json', '/listings/listing-types.json',
  '/listings/listing-fields.json', '/transactions/minimum-transaction-size.json'];
const imageTypes = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif',
};
const vendorImages = new Set(['sharetribe.imgix.net', 'cdn.st-api.com', 'assets-sharetribecom.sharetribe.com']);
const maxImageBytes = 8 * 1024 * 1024;
const pageName = /^[a-z0-9][a-z0-9-]{0,190}$/;

async function safeFetch(url, allowed, fetchImpl) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.port || url.username || url.password) {
      throw new Error('Unexpected presentation asset host');
    }
    const result = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    if (![301, 302, 303, 307, 308].includes(result.status)) return result;
    const next = result.headers.get('location');
    await result.body?.cancel();
    if (!next) throw new Error('Invalid presentation asset redirect');
    url = new URL(next, url);
  }
  throw new Error('Too many presentation asset redirects');
}

async function snapshotPresentation(env, { root = resolve(__dirname, '..'), fetchImpl = fetch } = {}) {
  const client = env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
  const version = env.REACT_APP_NATIVE_ASSET_VERSION;
  if (!/^[a-f0-9-]{36}$/i.test(client || '') || !/^[a-z0-9_-]+$/i.test(version || '')) {
    throw new Error('A pinned Sharetribe presentation version is required');
  }
  const base = 'https://cdn.st-api.com/v1/assets/pub/' + client + '/v/' + version + '/';
  const out = join(root, 'build', 'static', 'presentation');
  await mkdir(join(out, 'media'), { recursive: true });
  const config = await safeFetch(new URL(base + '?' + new URLSearchParams({ assets: configEntries.join(',') })),
    new Set(['cdn.st-api.com']), fetchImpl);
  if (!config.ok) throw new Error('Presentation config returned HTTP ' + config.status);
  const app = await config.json();
  if (!Array.isArray(app.data) || requiredConfigs.some(path =>
    !app.data.some(asset => asset.attributes?.assetPath === path))) {
    throw new Error('The presentation snapshot is missing required configuration');
  }

  const pages = new Map();
  async function capture(name) {
    if (!pageName.test(name)) throw new Error('Invalid page asset name');
    const result = await safeFetch(new URL(base + 'content/pages/' + name + '.json'), new Set(['cdn.st-api.com']), fetchImpl);
    if (result.status === 404) return;
    if (!result.ok) throw new Error('Page asset ' + name + ' returned HTTP ' + result.status);
    pages.set(name, await result.json());
  }
  for (const name of corePages) await capture(name);
  if (!pages.has('landing-page') || !pages.has('services')) throw new Error('The English landing or Services asset is missing');
  const names = new Set(corePages);
  const blog = pages.get('blog');
  function visit(value) {
    if (typeof value === 'string') {
      const link = value.match(/^\/(?:p|blog)\/([a-z0-9][a-z0-9-]{0,190})(?:[?#].*)?$/i);
      if (link) names.add(link[1]);
    } else if (value && typeof value === 'object') {
      for (const item of Object.values(value)) visit(item);
    }
  }
  visit(blog?.data);
  for (const name of names) {
    if (!pages.has(name) && !corePages.includes(name)) await capture(name);
    for (const locale of ['id', 'ru']) await capture(name + '-' + locale);
  }

  const imageCopies = new Map();
  async function replaceImages(value) {
    if (typeof value === 'string' && /^https:\/\//.test(value)) {
      const url = new URL(value);
      if (vendorImages.has(url.hostname) && !url.pathname.endsWith('.json')) {
        if (imageCopies.has(value)) return imageCopies.get(value);
        const response = await safeFetch(url, vendorImages, fetchImpl);
        const ext = imageTypes[response.headers.get('content-type')?.split(';')[0]];
        if (!response.ok || !ext || !response.body) {
          await response.body?.cancel();
          throw new Error('Unable to copy a Sharetribe presentation image: ' + response.status);
        }
        let size = 0;
        const chunks = [];
        for await (const chunk of response.body) {
          size += chunk.length;
          if (size > maxImageBytes) throw new Error('A presentation image exceeds the snapshot limit');
          chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        const filename = digest(bytes) + '.' + ext;
        await writeFile(join(out, 'media', filename), bytes);
        const local = '/static/presentation/media/' + filename;
        imageCopies.set(value, local);
        return local;
      }
    } else if (Array.isArray(value)) {
      const result = [];
      for (const item of value) result.push(await replaceImages(item));
      return result;
    } else if (value && typeof value === 'object') {
      const entries = [];
      for (const [key, item] of Object.entries(value)) entries.push([key, await replaceImages(item)]);
      return Object.fromEntries(entries);
    }
    return value;
  }

  const configFile = join(out, 'config.json');
  await writeFile(configFile, JSON.stringify(await replaceImages(app)));
  for (const [name, doc] of pages) {
    const file = join(out, 'pages', name + '.json');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(await replaceImages(doc)));
  }
  console.info('Presentation snapshot saved:', { version, pages: pages.size, imageVariants: imageCopies.size });
}

if (require.main === module) snapshotPresentation(process.env).catch(error => {
  console.error('Presentation snapshot failed:', error.message);
  process.exitCode = 1;
});

module.exports = { snapshotPresentation };


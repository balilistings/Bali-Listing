const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const translationsDir = path.join(__dirname, '../../src/translations');
const outputDir = path.join(__dirname, '../../build/static/locales');
const assets = new Map();
const safeJSON = value =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

function getAsset(locale) {
  if (!/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(locale || '')) return null;
  if (assets.has(locale)) return assets.get(locale);
  const source = path.join(translationsDir, `${locale}.json`);
  if (!fs.existsSync(source)) return null;
  const messages = JSON.parse(fs.readFileSync(source, 'utf8'));
  const script = `window.__BASE_LOCALE_MESSAGES__=${safeJSON(messages)};`;
  const hash = crypto
    .createHash('sha256')
    .update(script)
    .digest('hex');
  const filename = `${locale}.${hash}.js`;
  const asset = { messages, script, filename, url: `/static/locales/${filename}` };
  assets.set(locale, asset);
  return asset;
}

function buildAssets() {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const filename of fs.readdirSync(translationsDir)) {
    const asset = getAsset(filename.replace(/\.json$/, ''));
    if (asset) fs.writeFileSync(path.join(outputDir, asset.filename), asset.script);
  }
}

// Only externalize when the exact immutable asset exists in this deployment.
// Preserve every message and hosted override, and leave SSR's input untouched.
function prepareLocaleState(state) {
  const messages = state.locale?.messages;
  const asset = getAsset(state.locale?.locale);
  if (!asset || !messages || !fs.existsSync(path.join(outputDir, asset.filename))) return null;
  const overrides = Object.fromEntries(
    Object.entries(messages).filter(([key, value]) => asset.messages[key] !== value)
  );
  const removed = Object.keys(asset.messages).filter(
    key => !Object.prototype.hasOwnProperty.call(messages, key)
  );
  return {
    url: asset.url,
    state: { ...state, locale: { ...state.locale, messages: overrides } },
    restore: `(function(){var s=JSON.parse(window.__PRELOADED_STATE__);var m=Object.assign({},window.__BASE_LOCALE_MESSAGES__,s.locale.messages);${safeJSON(
      removed
    )}.forEach(function(k){delete m[k];});s.locale.messages=m;window.__PRELOADED_STATE__=JSON.stringify(s);window.__TRANSLATIONS__=JSON.stringify(m);})();`,
  };
}

module.exports = { buildAssets, getAsset, prepareLocaleState };

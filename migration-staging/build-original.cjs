'use strict';

const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const windows = process.platform === 'win32';
const env = {
  ...process.env,
  CI: 'false',
  INLINE_RUNTIME_CHUNK: 'false',
  REACT_APP_ENV: 'production',
  REACT_APP_NATIVE_MARKETPLACE: 'true',
  REACT_APP_NATIVE_ASSET_SNAPSHOT: process.env.MARKETPLACE_SNAPSHOT_PRESENTATION === 'true' ? 'true' : 'false',
  REACT_APP_NATIVE_ASSET_VERSION: 'ZwtpQ7zZZGMCoUUEW6ErzQ',
  REACT_APP_SHARETRIBE_SDK_CLIENT_ID: 'f4a347fa-5223-46ed-b013-d5587d0725fb',
  REACT_APP_SHARETRIBE_USING_SSL: 'true',
  REACT_APP_MULTICURRENCY_ENABLED: 'true',
  REACT_APP_USE_NEW_BLOG_PAGE: 'true',
  REACT_APP_SUPPORTED_LOCALES: 'en,id,ru',
  REACT_APP_MARKETPLACE_NAME: 'Bali Listings',
  REACT_APP_MARKETPLACE_ROOT_URL: process.env.MARKETPLACE_ORIGIN || process.env.RENDER_EXTERNAL_URL ||
    'https://balilistings-migration-staging.onrender.com',
  REACT_APP_GOOGLE_CLIENT_ID: process.env.MARKETPLACE_GOOGLE_CLIENT_ID || '',
  REACT_APP_FACEBOOK_APP_ID: '',
  REACT_APP_GOOGLE_ANALYTICS_ID: '',
};

function run(command, args) {
  const cmd = windows ? command + '.cmd' : command;
  const child = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env, shell: windows });
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status ?? 1);
}

run('npm', ['--prefix', 'migration-staging', 'install', '--omit=dev', '--no-audit', '--no-fund']);
if (process.env.MARKETPLACE_RENDER_ORIGINAL_FRONTEND === 'true') {
  run('yarn', ['install', '--frozen-lockfile', '--production=false', '--non-interactive',
    '--registry', 'https://registry.npmjs.org/']);
  run('yarn', ['build-web']);
  run('node', ['scripts/build-locale-assets.cjs']);
  if (env.REACT_APP_NATIVE_ASSET_SNAPSHOT === 'true') {
    run('node', ['migration-staging/snapshot-presentation.cjs']);
  }
}

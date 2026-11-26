'use strict';

const { readFile, stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const { extname, resolve, sep } = require('node:path');
const build = resolve(__dirname, '..', '..', 'build');
const staticFiles = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const uiRoutes = /^\/(?:$|(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:s|l|u|user|p|blog|login|signup|confirm|lists?|listings|favorites|profile-settings|account|recover-password|reset-password|verify-email|inbox|terms-of-service|privacy-policy|notfound|no-[a-z-]+)(?:\/|$))/i;
const csp = [
  "default-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'",
  "script-src 'self' https://api.mapbox.com https://maps.googleapis.com https://maps.gstatic.com",
  "connect-src 'self' https://cdn.st-api.com https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://maps.googleapis.com",
  "img-src 'self' data: blob: https:", "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com", "worker-src 'self' blob:",
].join('; ');

async function createOriginalFrontend(env) {
  if (env.MARKETPLACE_RENDER_ORIGINAL_FRONTEND !== 'true') return async () => false;
  const { ChunkExtractor } = require('@loadable/server');
  const extractor = new ChunkExtractor({ statsFile: resolve(build, 'loadable-stats.json') });
  const template = await readFile(resolve(build, 'index.html'), 'utf8');
  const index = Buffer.from(template
    .replace('<!--!ssrStyles-->', extractor.getStyleTags())
    .replace('<!--!ssrScripts-->', extractor.getScriptTags()));
  return async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) return false;
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/static/')) {
      const type = staticFiles[extname(pathname)];
      const file = resolve(build, '.' + pathname);
      if (!type || !file.startsWith(build + sep)) {
        res.writeHead(404).end();
        return true;
      }
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) res.writeHead(404).end();
      else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' });
        if (req.method === 'HEAD') res.end();
        else createReadStream(file).on('error', () => res.destroy()).pipe(res);
      }
      return true;
    }
    if (!uiRoutes.test(pathname) || pathname.startsWith('/l/') && pathname.endsWith('/edit')) return false;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': index.length,
      'Content-Security-Policy': csp,
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }).end(req.method === 'HEAD' ? undefined : index);
    return true;
  };
}

module.exports = { createOriginalFrontend };

const path = require('node:path');

// Content hashes make old URLs safe to cache across deploys. Unversioned files
// must revalidate; an environment toggle must not make them stale for a year.
const staticCacheControl = (file, enabled) =>
  enabled && /\.[a-f0-9]{8,64}\./i.test(path.basename(file))
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=0, must-revalidate';

const pageCacheControl = (req, res, isLandingPage, duration, cspEnabled) => {
  const authenticatedOrPersonalized =
    req.headers.cookie ||
    req.headers.authorization ||
    req.locals?.currentUser ||
    res.getHeader('Set-Cookie');
  return isLandingPage &&
    Number.isFinite(duration) &&
    duration > 0 &&
    !authenticatedOrPersonalized &&
    !cspEnabled
    ? `public, max-age=${duration}`
    : 'private, no-store';
};

module.exports = { staticCacheControl, pageCacheControl };

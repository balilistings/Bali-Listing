const supabase = require('./api-util/supabase');
const { getSupportedLocales } = require('../src/util/translation');
const { isBlogPage } = require('../src/util/seoUrls');

// Middleware to rewrite user URLs from /user/{slug} to /u/{id}
const rewriteMiddleware = async (req, res, next) => {
  const parts = req.path.split('/').filter(Boolean);
  const locale = getSupportedLocales().includes(parts[0]) ? parts.shift() : null;
  const prefix = locale ? `/${locale}` : '';
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  if (parts.length === 2 && parts[0] === 'p' && isBlogPage(parts[1])) {
    return res.redirect(301, `${prefix}/blog/${parts[1]}${query}`);
  }
  if (parts.length !== 2 || parts[0] !== 'user') return next();
  const slugOrId = parts[1];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) return next();

  if (slugOrId) {
    try {
      const { data, error } = await supabase
        .from('sharetribe_users')
        .select('user_id')
        .eq('slug', decodeURIComponent(slugOrId))
        .maybeSingle();

      if (error) {
        throw error;
      } else if (data) {
        req.url = `${prefix}/u/${data.user_id}${query}`;
      } else {
        return res
          .status(404)
          .set('Cache-Control', 'public, max-age=60')
          .send('Profile not found.');
      }
    } catch (err) {
      console.error('Profile slug lookup failed:', err.message);
      return res
        .status(503)
        .set('Cache-Control', 'no-store')
        .send('Profile temporarily unavailable.');
    }
  }
  next();
};

module.exports = rewriteMiddleware;

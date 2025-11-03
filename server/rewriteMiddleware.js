
const supabase = require('./api-util/supabase');
const { v4: uuidV4, validate: uuidValidate } = require('uuid');

// Middleware to rewrite user URLs from /user/{slug} to /u/{id}
const rewriteMiddleware = async (req, res, next) => {
  const pathParts = req.path.split('/');
  const slugOrId = pathParts[2];

  if (slugOrId && !uuidValidate(slugOrId)) {
    try {
      const { data, error } = await supabase
        .from('provider_users')
        .select('id')
        .eq('slug', slugOrId)
        .single();

      if (error) {
        console.error('Error fetching from Supabase:', error);
      } else if (data) {
        req.url = req.url.replace(`/user/${slugOrId}`, `/u/${data.id}`);
      }
    } catch (err) {
      console.error('Supabase query failed:', err);
    }
  }
  next();
};

module.exports = rewriteMiddleware;

const supabase = require('../api-util/supabase');

// const SUPABASE_ENV = process.env.SUPABASE_ENV;
const supabaseTableName = 'sharetribe_users';
const getUserIdBySlug = async (req, res) => {
  const { slug } = req.params;

  res.set('Cache-Control', 'public, max-age=3600');

  try {
    const { data, error } = await supabase
      .from(supabaseTableName)
      .select('user_id')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return res.status(500).send({ error: 'An error occurred' });
    }

    if (data) {
      return res.status(200).send({ userId: data.user_id });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Supabase query failed:', err);
    return res.status(500).send({ error: 'An error occurred' });
  }
};

const getSlugByUserId = async (req, res) => {
  const { userId } = req.params;

  res.set('Cache-Control', 'public, max-age=3600');

  try {
    const { data, error } = await supabase
      .from(supabaseTableName)
      .select('slug')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return res.status(500).send({ error: 'An error occurred' });
    }

    if (data) {
      return res.status(200).send({ slug: data.slug });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Supabase query failed:', err);
    return res.status(500).send({ error: 'An error occurred' });
  }
};

module.exports = { getUserIdBySlug, getSlugByUserId };

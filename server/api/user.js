const supabase = require('../api-util/supabase');

const getUserIdBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const { data, error } = await supabase
      .from('provider_users')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return res.status(500).send({ error: 'An error occurred' });
    }

    if (data) {
      return res.status(200).send({ userId: data.id });
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Supabase query failed:', err);
    return res.status(500).send({ error: 'An error occurred' });
  }
};

module.exports = { getUserIdBySlug };

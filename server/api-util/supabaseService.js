const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabaseService = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.error(
    'Supabase service client is not initialized. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.'
  );
}

module.exports = supabaseService;

/**
 * Generate unique slugs for users in the sharetribe_users table
 * Creates slugs based on first_name and surname, ensuring uniqueness
 */
const generateUniqueUserSlugs = async () => {
  const tableName = 'sharetribe_users';

  try {
    // Get all users that have first_name and surname but no slug or an empty slug
    const { data: users, error: fetchError } = await supabaseService
      .from(tableName)
      .select('user_id, first_name, surname, slug');

    console.log(users);

    if (fetchError) {
      throw fetchError;
    }

    // Helper function to create slug from name parts
    const createSlug = str => {
      let text = str
        .toString()
        .toLowerCase()
        .trim();

      const sets = [
        { to: 'a', from: 'ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ' },
        { to: 'c', from: 'ÇĆĈČ' },
        { to: 'd', from: 'ÐĎĐÞ' },
        { to: 'e', from: 'ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ' },
        { to: 'g', from: 'ĜĞĢǴ' },
        { to: 'h', from: 'ĤḦ' },
        { to: 'i', from: 'ÌÍÎÏĨĪĮİỈỊ' },
        { to: 'j', from: 'Ĵ' },
        { to: 'ij', from: 'Ĳ' },
        { to: 'k', from: 'Ķ' },
        { to: 'l', from: 'ĹĻĽŁ' },
        { to: 'm', from: 'Ḿ' },
        { to: 'n', from: 'ÑŃŅŇ' },
        { to: 'o', from: 'ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ' },
        { to: 'oe', from: 'Œ' },
        { to: 'p', from: 'ṕ' },
        { to: 'r', from: 'ŔŖŘ' },
        { to: 's', from: 'ßŚŜŞŠ' },
        { to: 't', from: 'ŢŤ' },
        { to: 'u', from: 'ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ' },
        { to: 'w', from: 'ẂŴẀẄ' },
        { to: 'x', from: 'ẍ' },
        { to: 'y', from: 'ÝŶŸỲỴỶỸ' },
        { to: 'z', from: 'ŹŻŽ' },
        { to: '-', from: "·/_,:;'" },
      ];

      sets.forEach(set => {
        text = text.replace(new RegExp(`[${set.from}]`, 'gi'), set.to);
      });

      const slug = encodeURIComponent(
        text
          .replace(/\s+/g, '-') // Replace spaces with -
          .replace(/[^\w-]+/g, '') // Remove all non-word chars
          .replace(/--+/g, '-') // Replace multiple - with single -
          .replace(/^-+/, '') // Trim - from start of text
          .replace(/-+$/, '') // Trim - from end of text
      );

      return slug.length > 0 ? slug : 'no-slug';
    };

    // Process each user
    for (const user of users) {
      // Create initial slug from first_name and surname
      const name = `${user.first_name || ''} ${user.surname || ''}`.trim();
      let slug = createSlug(name);

      // Check if slug already exists and make it unique
      let uniqueSlug = slug;
      let counter = 1;

      while (true) {
        // Check if the slug already exists for another user
        const { data: existingUser, error: checkError } = await supabaseService
          .from(tableName)
          .select('user_id')
          .eq('slug', uniqueSlug)
          .not('user_id', 'eq', user.user_id) // Exclude current user from check
          .single();

        if (checkError && checkError.code === 'PGRST116') {
          // No matching record found, slug is unique
          break;
        } else if (!checkError && existingUser) {
          // Slug exists, try with a counter suffix
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        } else if (checkError) {
          throw checkError;
        } else {
          break;
        }
      }

      // Update the user with the unique slug
      const { error: updateError } = await supabaseService
        .from(tableName)
        .update({ slug: uniqueSlug })
        .eq('user_id', user.user_id);

      if (updateError) {
        console.error(`Error updating user ${user.user_id} with slug ${uniqueSlug}:`, updateError);
      } else {
        console.log(`Updated user ${user.user_id} with slug: ${uniqueSlug}`);
      }
    }

    console.log(`Successfully processed ${users.length} users`);
    return { success: true, processedCount: users.length };
  } catch (error) {
    console.error('Error in generateUniqueUserSlugs:', error);
    return { success: false, error: error.message };
  }
};

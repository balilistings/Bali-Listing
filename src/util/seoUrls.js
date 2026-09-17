// Keep SEO signals on the HTTPS apex host without changing auth callbacks.
const seoRootURL = root =>
  (root || '').replace(/^https?:\/\/(?:www\.)?balilistings\.com\/?$/, 'https://balilistings.com');
const blogSlugs = [
  'best-neighborhood-in-bali-for-digital-nomads-2025-guide',
  'discovering-the-charm-of-traditional-balinese-villas',
  'how-to-find-a-long-term-rental-in-bali-without-getting-scammed',
  'the-ultimate-bali-villa-staycation-experience',
  'a-guide-to-booking-your-dream-villa-in-bali',
];
const isBlogPage = slug => blogSlugs.includes(slug.replace(/-(ru|id)$/, ''));
const seoPagePath = slug => `${isBlogPage(slug) ? 'blog' : 'p'}/${slug}`;
module.exports = { seoRootURL, isBlogPage, seoPagePath };

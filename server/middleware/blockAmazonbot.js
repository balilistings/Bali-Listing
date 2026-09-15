// Match the crawler's declared product token, not Amazon-hosted IP ranges.
module.exports = (req, res, next) => {
  const userAgent = String(req.headers['user-agent'] || '');
  if (!/\bAmazonbot(?:\/|\b)/i.test(userAgent)) return next();
  // A bot-specific rejection must never be reused for a normal visitor.
  res.set('Cache-Control', 'private, no-store');
  res.vary('User-Agent');
  return res.status(403).type('text/plain').send('Forbidden\n');
};

// Match only the declared crawler tokens, not shared cloud IP ranges.
module.exports = (req, res, next) => {
  const userAgent = String(req.headers['user-agent'] || '');
  if (!/\b(?:Amazonbot|PetalBot)(?:\/|\b)/i.test(userAgent)) return next();
  // A bot-specific rejection must never be reused for a normal visitor.
  res.set('Cache-Control', 'private, no-store');
  res.vary('User-Agent');
  return res.status(403).type('text/plain').send('Forbidden\n');
};

// Match only the declared crawler tokens, not shared cloud IP ranges.
module.exports = (req, res, next) => {
  const userAgent = String(req.headers['user-agent'] || '');
  // Let ClaudeBot read its opt-out instruction; block it before any page rendering.
  if (/\bClaudeBot(?:\/|\b)/i.test(userAgent) && req.path === '/robots.txt') return next();
  if (!/\b(?:Amazonbot|PetalBot|GPTBot|meta-externalagent|SemrushBot|Reflectionbot|ClaudeBot)(?:\/|\b)/i.test(userAgent)) return next();
  // A bot-specific rejection must never be reused for a normal visitor.
  res.set('Cache-Control', 'private, no-store');
  res.vary('User-Agent');
  return res.status(403).type('text/plain').send('Forbidden\n');
};

const { isIP } = require('net');

// Diagnostic only: never use a claimed user agent or forwarded address as an
// authentication decision. Render documents the first X-Forwarded-For address.
const clean = (value, limit) => String(value || '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, limit);
const safePath = url => {
  const pathname = String(url || '/').split(/[?#]/, 1)[0];
  // Do not retain identity, reset, verification, or short-link path tokens.
  if (/^\/(?:[a-z]{2}\/)?(?:sh|user|u|reset-password|password-reset|verify-email|email-verification|login|signup)(?:\/|$)/i.test(pathname)) {
    return pathname.split('/').slice(0, 2).join('/') + '/[redacted]';
  }
  return clean(pathname, 256).replace(/[^/]{65,}/g, '[redacted]');
};

module.exports = function requestTraffic({ render = process.env.RENDER === 'true', emit = line => console.log(line) } = {}) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const peer = req.socket.remoteAddress;
    const ip = render && isIP(forwarded) ? forwarded : isIP(peer || '') ? peer : null;
    const entry = {
      event: 'request_traffic', version: 1, time: new Date().toISOString(),
      method: clean(req.method, 16), path: safePath(req.originalUrl || req.url),
      ip, ipSource: render && isIP(forwarded) ? 'render-x-forwarded-for' : 'socket',
      userAgent: clean(req.headers['user-agent'], 256),
    };
    let bytes = 0;
    let logged = false;
    const count = (chunk, encoding) => {
      if (typeof chunk === 'string') bytes += Buffer.byteLength(chunk, typeof encoding === 'string' ? encoding : undefined);
      else if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) bytes += chunk.byteLength;
    };
    // Register before compression so these wrappers see the encoded body.
    const write = res.write;
    const end = res.end;
    res.write = function(chunk, encoding, callback) {
      count(chunk, encoding);
      return write.apply(this, arguments);
    };
    res.end = function(chunk, encoding, callback) {
      count(chunk, encoding);
      return end.apply(this, arguments);
    };
    const finish = () => {
      if (logged) return;
      logged = true;
      const noBody = req.method === 'HEAD' || res.statusCode === 204 || res.statusCode === 304;
      try {
        emit(JSON.stringify({ ...entry, status: res.statusCode,
          bodyBytes: noBody ? 0 : bytes, encoding: clean(res.getHeader('content-encoding') || 'identity', 32),
          durationMs: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
          completed: res.writableFinished,
        }));
      } catch (_) { /* Diagnostics must never prevent a response. */ }
    };
    res.once('finish', finish);
    res.once('close', finish);
    next();
  };
};

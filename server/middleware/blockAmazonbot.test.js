const middleware = require('./blockAmazonbot');
test.each(['Amazonbot/0.1', 'PetalBot/1', 'GPTBot/1', 'meta-externalagent/1', 'SemrushBot/7~bl', 'Reflectionbot/1', 'ClaudeBot/1.0', 'claudebot', 'Sogou web spider/4.0', 'Sogou inst spider/4.0', 'Sogou spider/4.0'])('blocks %s before rendering', agent => {
  const res = { set: jest.fn(), vary: jest.fn(), status: jest.fn(), type: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res); res.type.mockReturnValue(res);
  const next = jest.fn();
  middleware({ headers: { 'user-agent': agent } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
});
test.each(['Mozilla/5.0', 'Googlebot/2', 'bingbot/2', 'OAI-SearchBot/1', 'ChatGPT-User/1', 'facebookexternalhit/1', 'NotGPTBot/1', 'Claude-SearchBot/1.0', 'Claude-User/1.0', 'NotClaudeBot/1'])('preserves %s', agent => {
  const next = jest.fn();
  middleware({ headers: { 'user-agent': agent } }, {}, next);
  expect(next).toHaveBeenCalledTimes(1);
});

test('ClaudeBot can read its robots opt-out without opening listing pages', () => {
  const next = jest.fn();
  middleware({ path: '/robots.txt', headers: { 'user-agent': 'ClaudeBot/1.0' } }, {}, next);
  expect(next).toHaveBeenCalledTimes(1);
});

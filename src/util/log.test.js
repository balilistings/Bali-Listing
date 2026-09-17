import { onRecoverableError } from './log';
jest.mock('../config/settings', () => ({ sentryDsn: null }));
jest.mock('@sentry/browser', () => ({}));

test('React recovery reports the original error without throwing another error', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const original = new Error('Hydration mismatch');
    expect(() => onRecoverableError(original, { componentStack: 'at TestComponent' })).not.toThrow();
    expect(spy).toHaveBeenCalledWith(original);
    expect(original.cause.stack).toBe('at TestComponent');
    expect(spy).toHaveBeenCalledWith('Error code:', 'recoverable-error', 'data:', { componentStack: 'at TestComponent' });
  } finally {
    spy.mockRestore();
  }
});

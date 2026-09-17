import { canonicalRoutePath } from './routes';
const routes = [{ name:'ListingPage', path:'/l/:slug/:id' }];
test('localized listing canonical retains locale but removes display slug and tracking query', () => {
  const original = process.env.REACT_APP_SUPPORTED_LOCALES;
  process.env.REACT_APP_SUPPORTED_LOCALES = 'en,ru,id';
  expect(canonicalRoutePath(routes, { pathname:'/ru/l/villa/123', search:'?utm_source=test', hash:'#contact' }, true)).toBe('/ru/l/123');
  process.env.REACT_APP_SUPPORTED_LOCALES = original;
});

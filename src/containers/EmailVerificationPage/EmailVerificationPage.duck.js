import { parse } from '../../util/urlHelpers';
import { verify } from '../../ducks/emailVerification.duck';
import { nativeMarketplace } from '../../util/nativeMarketplace';

// ================ Thunks ================ //

export const loadData = (params, search) => {
  if (nativeMarketplace) return () => Promise.resolve();
  const urlParams = parse(search);
  const verificationToken = urlParams.t;
  const token = verificationToken ? `${verificationToken}` : null;
  return verify(token);
};

const sdkUtils = require('../api-util/sdk');

// A middleware to read user ID from a cookie
// and attach it to the request.
const attachCurrentUser = (req, res, next) => {
  const userId = req.cookies['st-userid'];
  if (userId) {
    req.locals = req.locals || {};
    req.locals.currentUser = { id: userId };
    next();
  } else {
    // Cookie not found, let's see if the user is actually logged in.
    const sdk = sdkUtils.getSdk(req, res);
    sdk.authInfo()
      .then(authInfo => {
        if (authInfo && authInfo.isAnonymous === false) {
          // User is logged in, but the 'st-userid' cookie is missing.
          // This is our fallback. We fetch the user and repopulate the cookie.
          return sdk.currentUser.show().then(userResponse => {
            const currentUserId = userResponse.data.data.id;
            res.cookie('st-userid', currentUserId.uuid, {
              maxAge: 14 * 24 * 60 * 60 * 1000,
              httpOnly: true,
              secure: process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true',
            });
            req.locals = req.locals || {};
            req.locals.currentUser = { id: currentUserId.uuid };
            next();
          });
        } else {
          // User is not logged in, so no user to attach.
          next();
        }
      })
      .catch(() => {
        // Error fetching auth info, just proceed without a user.
        next();
      });
  }
};

module.exports = attachCurrentUser;

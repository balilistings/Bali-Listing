import { useEffect, useState } from 'react';

import { get } from './api';

const userSlugRequests = new Map();

export const fetchUserSlug = userId => {
  if (!userId) {
    return Promise.resolve(null);
  }

  if (!userSlugRequests.has(userId)) {
    const request = get(`/api/users/${userId}/slug`)
      .then(response => response?.slug || null)
      .catch(() => null);
    userSlugRequests.set(userId, request);
  }

  return userSlugRequests.get(userId);
};

const useUserSlug = userId => {
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setSlug(null);

    fetchUserSlug(userId).then(nextSlug => {
      if (isMounted) {
        setSlug(nextSlug);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return slug;
};

export default useUserSlug;

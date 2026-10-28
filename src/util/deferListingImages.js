// Shared by server rendering and the browser listing endpoint. Never mutate a cached response.
export default response => {
  const data = response?.data;
  const listings = Array.isArray(data?.data) ? data.data : [data?.data];
  const covers = new Set();
  const deferredIds = new Set();
  listings.forEach(listing => {
    const images = listing?.relationships?.images?.data || [];
    if (images[0]) covers.add(images[0].id.uuid);
    images.slice(1).forEach(image => deferredIds.add(image.id.uuid));
  });
  covers.forEach(id => deferredIds.delete(id));
  return {
    ...response,
    data: {
      ...data,
      included: data?.included?.map(resource =>
        resource.type === 'image' && deferredIds.has(resource.id.uuid)
          ? { id: resource.id, type: resource.type, attributes: { variants: {}, deferred: true } }
          : resource
      ),
    },
  };
};

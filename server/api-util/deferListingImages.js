// Shared by server rendering and the browser listing endpoint. Never mutate a cached response.
module.exports = response => {
  const data = response?.data;
  const images = data?.data?.relationships?.images?.data || [];
  const deferredIds = new Set(images.slice(1).map(image => image.id.uuid));
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

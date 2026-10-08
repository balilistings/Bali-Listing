const { getReadSdk, serialize, handleError } = require('../api-util/sdk');
const deferListingImages = require('../../src/util/deferListingImages');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const send = (res, data) => res.set('Cache-Control', 'private, no-store').type('application/transit+json').send(serialize(data));

// Uses the caller's Marketplace API permissions, never the privileged Integration API.
exports.show = async (req, res) => {
  const params = req.body?.params;
  if (!uuid.test(params?.id?.uuid || params?.id || '')) return res.status(400).json({ error: 'Invalid listing' });
  try {
    const response = await getReadSdk(req, res).listings.show(params);
    return send(res, deferListingImages(response).data);
  } catch (error) { return handleError(res, error); }
};

exports.photo = async (req, res) => {
  const { listingId, imageId } = req.params;
  if (!uuid.test(listingId) || !uuid.test(imageId)) return res.status(400).json({ error: 'Invalid photo' });
  try {
    const response = await getReadSdk(req, res).listings.show({
      id: listingId,
      include: ['images'],
      'limit.images': 100,
      'fields.image': ['variants.scaled-small', 'variants.scaled-medium', 'variants.scaled-large', 'variants.scaled-xlarge'],
    });
    const belongs = response.data.data.relationships?.images?.data?.some(image => image.id.uuid === imageId);
    const image = belongs && response.data.included?.find(image => image.type === 'image' && image.id.uuid === imageId);
    if (!image) return res.status(404).json({ error: 'Photo not found' });
    return send(res, image);
  } catch (error) { return handleError(res, error); }
};

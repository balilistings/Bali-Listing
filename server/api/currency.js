
const { fetchRate } = require('../api-util/currencyLogic');

const getConversionRate = (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  fetchRate()
    .then(rate => res.json(rate))
    .catch(error => res.status(500).json({ error: error.message }));
};

module.exports = { getConversionRate };



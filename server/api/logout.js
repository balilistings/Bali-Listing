module.exports = (req, res) => {
  res.clearCookie('st-userid');
  res.status(204).send();
};

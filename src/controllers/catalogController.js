const CatalogService = require('../services/catalogService');

const CatalogController = {
  getParts: (req, res, next) => {
    try {
      const { keyword, category, minPrice, maxPrice } = req.query;
      const parts = CatalogService.getParts({ keyword, category, minPrice, maxPrice });
      res.json({ parts });
    } catch (err) {
      next(err);
    }
  },

  getSlots: (req, res, next) => {
    try {
      const slots = CatalogService.getSlots();
      res.json({ slots });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = CatalogController;

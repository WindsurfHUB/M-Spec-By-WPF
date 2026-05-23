const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalogController');

router.get('/', CatalogController.getSlots);

module.exports = router;

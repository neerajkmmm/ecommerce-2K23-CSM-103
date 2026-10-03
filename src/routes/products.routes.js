const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const {
  createProduct,
  updateProduct,
  listProducts,
} = require('../controllers/products.controller');
const { createSku } = require('../controllers/skus.controller');

const router = express.Router();

router.post('/', requireAdmin, createProduct);
router.patch('/:id', requireAdmin, updateProduct);
router.get('/', requireAdmin, listProducts);
router.post('/:id/skus', requireAdmin, createSku);

module.exports = router;

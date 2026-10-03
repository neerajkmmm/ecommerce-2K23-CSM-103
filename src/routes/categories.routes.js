const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const {
  createCategory,
  updateCategory,
  listCategories,
} = require('../controllers/categories.controller');

const router = express.Router();

router.post('/', requireAdmin, createCategory);
router.patch('/:id', requireAdmin, updateCategory);
router.get('/', requireAdmin, listCategories);

module.exports = router;

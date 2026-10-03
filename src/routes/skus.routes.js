const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { updateSku } = require('../controllers/skus.controller');

const router = express.Router();

router.patch('/:id', requireAdmin, updateSku);

module.exports = router;

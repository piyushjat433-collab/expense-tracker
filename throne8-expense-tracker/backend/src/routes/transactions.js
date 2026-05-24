const express = require('express');
const { CATEGORIES } = require('../services/categorizer');
const router = express.Router();

/**
 * GET /api/transactions/categories
 * Returns all supported categories with metadata
 */
router.get('/categories', (req, res) => {
  const categories = Object.entries(CATEGORIES).map(([name, data]) => ({
    name,
    icon: data.icon,
    color: data.color,
  }));
  categories.push({ name: 'Other', icon: '📦', color: '#B2BEC3' });
  res.json({ success: true, data: categories });
});

module.exports = router;

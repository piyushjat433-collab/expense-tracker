const { CATEGORIES } = require('../categorizer.js');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const categories = Object.entries(CATEGORIES).map(([name, config]) => ({
    name, icon: config.icon, color: config.color,
  }));
  return res.json({ success: true, data: categories });
};

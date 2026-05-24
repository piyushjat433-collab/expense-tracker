const express = require('express');
const multer = require('multer');
const { parsePDF, generateDemoTransactions } = require('../services/pdfParser');
const { buildSummary, generateAlerts } = require('../services/categorizer');

const router = express.Router();

// ── Multer Config ─────────────────────────────────────────────────────────────
const storage = multer.memoryStorage(); // Store in memory for direct parsing

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * POST /api/upload
 * Accepts a PDF bank statement, parses transactions, returns summary + alerts
 */
router.post('/', upload.single('statement'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const { transactions, pageCount, rawTextLength } = await parsePDF(req.file.buffer);
    const budgetLimits = req.body.budgets ? JSON.parse(req.body.budgets) : {};

    const summary = buildSummary(transactions);
    const alerts = generateAlerts(summary, budgetLimits);

    res.json({
      success: true,
      data: {
        transactions,
        summary,
        alerts,
        meta: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          pageCount,
          rawTextLength,
          parsedAt: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/upload/demo
 * Returns demo data (no PDF required — useful for testing/presentation)
 */
router.get('/demo', (req, res) => {
  const transactions = generateDemoTransactions();
  const summary = buildSummary(transactions);
  const alerts = generateAlerts(summary);

  res.json({
    success: true,
    data: {
      transactions,
      summary,
      alerts,
      meta: {
        fileName: 'HDFC_Statement_Demo.pdf',
        fileSize: 245760,
        pageCount: 3,
        parsedAt: new Date().toISOString(),
        isDemo: true,
      },
    },
  });
});

module.exports = router;

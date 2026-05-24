import { generateDemoTransactions } from '../pdfParser.js';
import { buildSummary, generateAlerts } from '../categorizer.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const transactions = generateDemoTransactions();
  const summary = buildSummary(transactions);
  const alerts = generateAlerts(summary);

  return res.json({
    success: true,
    data: {
      transactions, summary, alerts,
      meta: {
        fileName: 'HDFC_Statement_Demo.pdf',
        fileSize: 245760,
        pageCount: 3,
        parsedAt: new Date().toISOString(),
        isDemo: true,
      },
    },
  });
}

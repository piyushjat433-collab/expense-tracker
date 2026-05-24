import formidable from 'formidable';
import fs from 'fs';
import { parsePDF, generateDemoTransactions } from './pdfParser.js';
import { buildSummary, generateAlerts } from './categorizer.js';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const transactions = generateDemoTransactions();
    const summary = buildSummary(transactions);
    const alerts = generateAlerts(summary);
    return res.json({
      success: true,
      data: {
        transactions, summary, alerts,
        meta: {
          fileName: 'HDFC_Statement_Demo.pdf',
          fileSize: 245760, pageCount: 3,
          parsedAt: new Date().toISOString(),
          isDemo: true,
        },
      },
    });
  }

  if (req.method === 'POST') {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ success: false, error: 'Upload failed: ' + err.message });

      const fileArr = files.statement;
      const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
      if (!file) return res.status(400).json({ success: false, error: 'No PDF file uploaded' });

      try {
        const buffer = fs.readFileSync(file.filepath || file.path);
        const { transactions, pageCount, rawTextLength } = await parsePDF(buffer);
        const budgetsRaw = Array.isArray(fields.budgets) ? fields.budgets[0] : fields.budgets;
        const budgetLimits = budgetsRaw ? JSON.parse(budgetsRaw) : {};
        const summary = buildSummary(transactions);
        const alerts = generateAlerts(summary, budgetLimits);

        return res.json({
          success: true,
          data: {
            transactions, summary, alerts,
            meta: {
              fileName: file.originalFilename || 'statement.pdf',
              fileSize: file.size, pageCount, rawTextLength,
              parsedAt: new Date().toISOString(),
            },
          },
        });
      } catch (e) {
        return res.status(422).json({ success: false, error: e.message });
      }
    });
    return;
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

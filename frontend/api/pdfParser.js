const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { categorize } = require('./categorizer.js');

const DATE_PATTERNS = [
  /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/,
  /\b(\d{2}[-\/]\d{2}[-\/]\d{2})\b/,
  /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/,
  /\b(\d{2}\s+\w{3}\s+\d{4})\b/,
  /\b(\d{1,2}\s+\w{3},?\s+\d{4})\b/,
];

function normalizeDate(raw) {
  if (!raw) return new Date().toISOString().split('T')[0];
  const cleaned = raw.trim();
  const dmy = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (dmy) return ${dmy[3]}-${dmy[2]}-${dmy[1]};
  const dmyShort = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/);
  if (dmyShort) return 20${dmyShort[3]}-${dmyShort[2]}-${dmyShort[1]};
  const parsed = new Date(cleaned);
  if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

function determineType(line, description) {
  const lower = (line + ' ' + description).toLowerCase();
  const debitWords = ['dr', 'debit', 'payment', 'purchase', 'withdrawal', 'paid', 'transfer to', 'sent'];
  const creditWords = ['cr', 'credit', 'deposit', 'received', 'refund', 'cashback', 'transfer from', 'salary'];
  const hasDebit = debitWords.some(w => lower.includes(w));
  const hasCredit = creditWords.some(w => lower.includes(w));
  if (hasCredit && !hasDebit) return 'credit';
  return 'debit';
}

function extractTransactions(text) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let dateMatch = null;
    for (const pattern of DATE_PATTERNS) {
      const m = line.match(pattern);
      if (m) { dateMatch = m[1]; break; }
    }
    if (!dateMatch) continue;
    const amounts = [];
    let amtMatch;
    const amtRegex = /([0-9,]+\.[0-9]{2})/g;
    while ((amtMatch = amtRegex.exec(line)) !== null) {
      const val = parseAmount(amtMatch[1]);
      if (val > 0 && val < 10000000) amounts.push(val);
    }
    if (amounts.length === 0) continue;
    const dateEnd = line.indexOf(dateMatch) + dateMatch.length;
    const firstAmtIdx = line.search(/[0-9,]+\.[0-9]{2}/);
    let description = line.substring(dateEnd, firstAmtIdx > dateEnd ? firstAmtIdx : line.length).trim();
    description = description.replace(/[|\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (description.length < 3 && i + 1 < lines.length) {
      description = lines[i + 1].substring(0, 60).trim();
    }
    if (!description || description.length < 2) continue;
    transactions.push({
      id: uuidv4(),
      date: normalizeDate(dateMatch),
      description: description.substring(0, 100),
      amount: amounts[0],
      type: determineType(line, description),
      category: categorize(description),
      rawLine: line.substring(0, 150),
    });
  }
  if (transactions.length < 3) return extractTransactionsBroadSweep(text);
  return transactions;
}

function extractTransactionsBroadSweep(text) {
  const transactions = [];
  const txPattern = /(.{10,80}?)\s+([\d,]+\.\d{2})\s*(Cr|Dr|CR|DR)?/g;
  let match;
  while ((match = txPattern.exec(text)) !== null) {
    const rawDesc = match[1].trim();
    const amount = parseAmount(match[2]);
    const typeHint = match[3] || '';
    if (amount <= 0 || amount > 10000000) continue;
    let date = new Date().toISOString().split('T')[0];
    for (const pattern of DATE_PATTERNS) {
      const dm = rawDesc.match(pattern);
      if (dm) { date = normalizeDate(dm[1]); break; }
    }
    const description = rawDesc.replace(/\d{2}[-\/]\d{2}[-\/]\d{2,4}/g, '').trim();
    if (!description || description.length < 3) continue;
    const type = typeHint.toLowerCase().includes('cr') ? 'credit'

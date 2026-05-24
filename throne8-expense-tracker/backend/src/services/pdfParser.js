const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { categorize } = require('./categorizer');

/**
 * Bank Statement Parsers
 * Each bank has slightly different statement format — we try multiple regex patterns
 */

// ── Date Patterns ─────────────────────────────────────────────────────────────
const DATE_PATTERNS = [
  /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/,   // DD-MM-YYYY or DD/MM/YYYY
  /\b(\d{2}[-\/]\d{2}[-\/]\d{2})\b/,    // DD-MM-YY
  /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/,   // YYYY-MM-DD
  /\b(\d{2}\s+\w{3}\s+\d{4})\b/,        // 15 Jan 2024
  /\b(\d{1,2}\s+\w{3},?\s+\d{4})\b/,    // 5 Jan, 2024
];

// ── Amount Pattern ────────────────────────────────────────────────────────────
const AMOUNT_PATTERN = /(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.\d{1,2})?)/gi;

/**
 * Normalize a date string to YYYY-MM-DD format
 */
function normalizeDate(raw) {
  if (!raw) return new Date().toISOString().split('T')[0];
  const cleaned = raw.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  // DD-MM-YY
  const dmyShort = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/);
  if (dmyShort) return `20${dmyShort[3]}-${dmyShort[2]}-${dmyShort[1]}`;

  // YYYY-MM-DD
  const ymd = cleaned.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
  if (ymd) return cleaned;

  // Try native Date parsing as fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];

  return new Date().toISOString().split('T')[0];
}

/**
 * Parse amount string to float
 */
function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

/**
 * Determine if a transaction is debit or credit
 */
function determineType(line, description) {
  const lower = (line + ' ' + description).toLowerCase();
  const debitWords = ['dr', 'debit', 'payment', 'purchase', 'withdrawal', 'paid', 'transfer to', 'sent'];
  const creditWords = ['cr', 'credit', 'deposit', 'received', 'refund', 'cashback', 'transfer from', 'salary'];

  const hasDebit = debitWords.some(w => lower.includes(w));
  const hasCredit = creditWords.some(w => lower.includes(w));

  if (hasCredit && !hasDebit) return 'credit';
  return 'debit'; // Default to debit (expense)
}

/**
 * Extract transactions from raw text using multiple strategies
 */
function extractTransactions(text) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: Line-by-line structured parsing
  // Looks for lines that contain date + amount patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try to find a date in this line
    let dateMatch = null;
    for (const pattern of DATE_PATTERNS) {
      const m = line.match(pattern);
      if (m) { dateMatch = m[1]; break; }
    }
    if (!dateMatch) continue;

    // Find all amounts in the line
    const amounts = [];
    let amtMatch;
    const amtRegex = /([0-9,]+\.[0-9]{2})/g;
    while ((amtMatch = amtRegex.exec(line)) !== null) {
      const val = parseAmount(amtMatch[1]);
      if (val > 0 && val < 10000000) amounts.push(val);
    }
    if (amounts.length === 0) continue;

    // Extract description (text between date and first amount)
    const dateEnd = line.indexOf(dateMatch) + dateMatch.length;
    const firstAmtIdx = line.search(/[0-9,]+\.[0-9]{2}/);
    let description = line.substring(dateEnd, firstAmtIdx > dateEnd ? firstAmtIdx : line.length).trim();
    description = description.replace(/[|\/\\]/g, ' ').replace(/\s+/g, ' ').trim();

    // If description too short, grab from next line
    if (description.length < 3 && i + 1 < lines.length) {
      description = lines[i + 1].substring(0, 60).trim();
    }

    if (!description || description.length < 2) continue;

    // The first amount is usually the transaction amount
    const amount = amounts[0];

    transactions.push({
      id: uuidv4(),
      date: normalizeDate(dateMatch),
      description: description.substring(0, 100),
      amount,
      type: determineType(line, description),
      category: categorize(description),
      rawLine: line.substring(0, 150),
    });
  }

  // Strategy 2: If Strategy 1 found < 3 transactions, use broader regex sweep
  if (transactions.length < 3) {
    return extractTransactionsBroadSweep(text);
  }

  return transactions;
}

/**
 * Broad sweep: tries to find any monetary transaction in the text
 */
function extractTransactionsBroadSweep(text) {
  const transactions = [];

  // Match lines with amounts like 1,234.56 or 1234.56
  const txPattern = /(.{10,80}?)\s+([\d,]+\.\d{2})\s*(Cr|Dr|CR|DR)?/g;
  let match;

  while ((match = txPattern.exec(text)) !== null) {
    const rawDesc = match[1].trim();
    const amountStr = match[2];
    const typeHint = match[3] || '';

    const amount = parseAmount(amountStr);
    if (amount <= 0 || amount > 10000000) continue;

    // Try to find a date near this line
    let date = new Date().toISOString().split('T')[0];
    for (const pattern of DATE_PATTERNS) {
      const dm = rawDesc.match(pattern);
      if (dm) { date = normalizeDate(dm[1]); break; }
    }

    const description = rawDesc.replace(/\d{2}[-\/]\d{2}[-\/]\d{2,4}/g, '').trim();
    if (!description || description.length < 3) continue;

    const type = typeHint.toLowerCase().includes('cr') ? 'credit'
      : typeHint.toLowerCase().includes('dr') ? 'debit'
      : determineType(rawDesc, description);

    transactions.push({
      id: uuidv4(),
      date,
      description: description.substring(0, 100),
      amount,
      type,
      category: categorize(description),
      rawLine: match[0].substring(0, 150),
    });
  }

  return transactions;
}

/**
 * Generate demo transactions when no real PDF is provided (for testing)
 */
function generateDemoTransactions() {
  const demos = [
    { desc: 'Swiggy Order #1234', amount: 349, type: 'debit', daysAgo: 1 },
    { desc: 'Amazon Shopping - Electronics', amount: 2999, type: 'debit', daysAgo: 2 },
    { desc: 'Salary Credit', amount: 45000, type: 'credit', daysAgo: 3 },
    { desc: 'Uber Ride to Airport', amount: 450, type: 'debit', daysAgo: 4 },
    { desc: 'Netflix Subscription', amount: 649, type: 'debit', daysAgo: 5 },
    { desc: 'Zomato Food Order', amount: 280, type: 'debit', daysAgo: 6 },
    { desc: 'Airtel Postpaid Bill', amount: 999, type: 'debit', daysAgo: 7 },
    { desc: 'Flipkart Purchase - Shoes', amount: 1799, type: 'debit', daysAgo: 8 },
    { desc: 'Apollo Pharmacy', amount: 560, type: 'debit', daysAgo: 9 },
    { desc: 'IRCTC Train Ticket', amount: 1250, type: 'debit', daysAgo: 10 },
    { desc: 'Dominos Pizza Order', amount: 520, type: 'debit', daysAgo: 11 },
    { desc: 'Myntra - Clothing', amount: 1499, type: 'debit', daysAgo: 12 },
    { desc: 'Udemy Course Purchase', amount: 499, type: 'debit', daysAgo: 13 },
    { desc: 'Starbucks Coffee', amount: 380, type: 'debit', daysAgo: 14 },
    { desc: 'OLA Cab Booking', amount: 230, type: 'debit', daysAgo: 15 },
    { desc: 'Electricity Bill BESCOM', amount: 1200, type: 'debit', daysAgo: 16 },
    { desc: 'Zomato Gold Subscription', amount: 149, type: 'debit', daysAgo: 17 },
    { desc: 'BigBasket Grocery', amount: 1850, type: 'debit', daysAgo: 18 },
    { desc: 'PVR Cinema Tickets', amount: 680, type: 'debit', daysAgo: 19 },
    { desc: 'JIO Recharge', amount: 719, type: 'debit', daysAgo: 20 },
    { desc: 'Swiggy Instamart', amount: 430, type: 'debit', daysAgo: 21 },
    { desc: 'MakeMyTrip Flight Booking', amount: 5400, type: 'debit', daysAgo: 22 },
    { desc: 'Freelance Payment Received', amount: 12000, type: 'credit', daysAgo: 23 },
    { desc: 'McDonalds', amount: 260, type: 'debit', daysAgo: 24 },
    { desc: 'Amazon Prime Subscription', amount: 1499, type: 'debit', daysAgo: 25 },
    { desc: 'Decathlon Sports Equipment', amount: 3200, type: 'debit', daysAgo: 26 },
    { desc: 'Byju\'s Course Fee', amount: 2000, type: 'debit', daysAgo: 27 },
    { desc: 'Rapido Bike Ride', amount: 80, type: 'debit', daysAgo: 28 },
    { desc: 'DMart Grocery Shopping', amount: 2300, type: 'debit', daysAgo: 29 },
    { desc: 'YouTube Premium', amount: 189, type: 'debit', daysAgo: 30 },
  ];

  return demos.map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d.daysAgo);
    return {
      id: uuidv4(),
      date: date.toISOString().split('T')[0],
      description: d.desc,
      amount: d.amount,
      type: d.type,
      category: categorize(d.desc),
      rawLine: `${date.toISOString().split('T')[0]} | ${d.desc} | ${d.amount}`,
    };
  });
}

/**
 * Main PDF parsing function
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Array>} parsed transactions
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;

    if (!text || text.trim().length < 50) {
      throw new Error('PDF appears to be empty or scanned (image-based). Please use a text-based bank statement.');
    }

    const transactions = extractTransactions(text);

    if (transactions.length === 0) {
      throw new Error('No transactions found in the PDF. Make sure it is a valid bank statement.');
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { transactions, pageCount: data.numpages, rawTextLength: text.length };
  } catch (err) {
    if (err.message.includes('No transactions') || err.message.includes('empty')) {
      throw err;
    }
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

module.exports = { parsePDF, generateDemoTransactions };

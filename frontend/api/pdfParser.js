import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { categorize } from './categorizer.js';

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
  const ymd = cleaned.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
  if (ymd) return cleaned;
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
      : typeHint.toLowerCase().includes('dr') ? 'debit'
      : determineType(rawDesc, description);transactions.push({
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

export function generateDemoTransactions() {
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
    { desc: 'BigBasket Grocery', amount: 1850, type: 'debit', daysAgo: 18 },
    { desc: 'PVR Cinema Tickets', amount: 680, type: 'debit', daysAgo: 19 },
    { desc: 'JIO Recharge', amount: 719, type: 'debit', daysAgo: 20 },
    { desc: 'MakeMyTrip Flight Booking', amount: 5400, type: 'debit', daysAgo: 22 },
    { desc: 'Freelance Payment Received', amount: 12000, type: 'credit', daysAgo: 23 },
    { desc: 'Amazon Prime Subscription', amount: 1499, type: 'debit', daysAgo: 25 },
    { desc: 'Decathlon Sports Equipment', amount: 3200, type: 'debit', daysAgo: 26 },
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
      rawLine: ${date.toISOString().split('T')[0]} | ${d.desc} | ${d.amount},
    };
  });
}

export async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text;
    if (!text || text.trim().length < 50) {
      throw new Error('PDF appears to be empty or scanned. Please use a text-based bank statement.');
    }
    const transactions = extractTransactions(text);
    if (transactions.length === 0) {
      throw new Error('No transactions found. Make sure it is a valid bank statement.');
    }
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { transactions, pageCount: data.numpages, rawTextLength: text.length };
  } catch (err) {
    if (err.message.includes('No transactions') || err.message.includes('empty')) throw err;
    throw new Error(Failed to parse PDF: ${err.message});
  }
}

/**
 * Transaction Categorizer Service
 * Uses keyword-based regex matching to auto-categorize bank transactions
 */

const CATEGORIES = {
  Food: {
    icon: '🍔',
    color: '#FF6B6B',
    keywords: [
      'swiggy', 'zomato', 'dominos', 'pizza', 'mcdonalds', 'kfc', 'subway',
      'restaurant', 'hotel', 'cafe', 'coffee', 'starbucks', 'burger', 'biryani',
      'food', 'eat', 'dine', 'bakery', 'dhaba', 'canteen', 'mess', 'kitchen',
      'barbeque', 'bbq', 'chai', 'snack', 'dunzo', 'uber eats', 'bigbasket',
      'grofers', 'blinkit', 'zepto', 'instamart', 'fresh', 'grocery', 'supermarket',
    ],
  },
  Travel: {
    icon: '✈️',
    color: '#4ECDC4',
    keywords: [
      'uber', 'ola', 'rapido', 'lyft', 'taxi', 'auto', 'cab', 'metro', 'irctc',
      'railways', 'makemytrip', 'goibibo', 'cleartrip', 'yatra', 'redbus', 'bus',
      'flight', 'air india', 'indigo', 'spicejet', 'vistara', 'petrol', 'fuel',
      'travel', 'trip', 'tour', 'parking', 'toll', 'ola money', 'rapido',
      'fasttag', 'highway', 'express', 'train', 'airbnb', 'oyo', 'hotel booking',
    ],
  },
  Shopping: {
    icon: '🛍️',
    color: '#45B7D1',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'snapdeal',
      'shopify', 'tata cliq', 'reliance', 'dm mart', 'dmart', 'big bazaar',
      'reliance fresh', 'decathlon', 'lifestyle', 'pantaloons', 'max fashion',
      'westside', 'zara', 'h&m', 'shopping', 'mall', 'store', 'retail',
      'electronics', 'mobile', 'laptop', 'gadget', 'appliance',
    ],
  },
  Entertainment: {
    icon: '🎬',
    color: '#96CEB4',
    keywords: [
      'netflix', 'hotstar', 'prime video', 'disney', 'amazon prime', 'youtube',
      'spotify', 'gaana', 'jio saavn', 'apple music', 'pvr', 'inox', 'cinepolis',
      'bookmyshow', 'ticketmaster', 'gaming', 'game', 'steam', 'playstation',
      'xbox', 'movie', 'cinema', 'theatre', 'concert', 'event', 'show',
    ],
  },
  Health: {
    icon: '💊',
    color: '#FFEAA7',
    keywords: [
      'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'apollo', 'medplus',
      'netmeds', '1mg', 'pharmeasy', 'lenskart', 'gym', 'fitness', 'yoga',
      'cult.fit', 'healthify', 'insurance', 'mediclaim', 'diagnostic', 'lab',
      'pathology', 'x-ray', 'scan', 'medicine', 'chemist', 'drug',
    ],
  },
  Bills: {
    icon: '📄',
    color: '#DDA0DD',
    keywords: [
      'electricity', 'water', 'gas', 'broadband', 'wifi', 'internet', 'airtel',
      'jio', 'bsnl', 'vi ', 'vodafone', 'idea', 'recharge', 'mobile bill',
      'postpaid', 'emi', 'loan', 'mortgage', 'rent', 'maintenance', 'society',
      'utility', 'bill payment', 'paytm', 'phonepe', 'google pay', 'dth',
      'tata sky', 'dish tv', 'sun direct', 'subscription',
    ],
  },
  Education: {
    icon: '📚',
    color: '#A29BFE',
    keywords: [
      'udemy', 'coursera', 'byju', 'unacademy', 'vedantu', 'toppr', 'school',
      'college', 'university', 'tuition', 'coaching', 'books', 'stationery',
      'course', 'certification', 'exam', 'upskill', 'learning', 'education',
    ],
  },
  Transfer: {
    icon: '💸',
    color: '#74B9FF',
    keywords: [
      'neft', 'rtgs', 'imps', 'upi', 'transfer', 'sent to', 'received from',
      'wallet', 'cashback', 'refund', 'revert', 'credit', 'debit', 'atm',
      'withdrawal', 'deposit', 'cheque', 'dd', 'demand draft',
    ],
  },
};

const OTHER_CATEGORY = {
  name: 'Other',
  icon: '📦',
  color: '#B2BEC3',
};

/**
 * Categorize a single transaction description
 * @param {string} description - Transaction description/narration
 * @returns {string} Category name
 */
function categorize(description) {
  if (!description) return 'Other';
  const lower = description.toLowerCase();

  for (const [category, config] of Object.entries(CATEGORIES)) {
    if (config.keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

/**
 * Get category metadata (icon + color)
 */
function getCategoryMeta(categoryName) {
  return CATEGORIES[categoryName] || { ...OTHER_CATEGORY };
}

/**
 * Build monthly summary grouped by category
 * @param {Array} transactions
 * @returns {Object} summary
 */
function buildSummary(transactions) {
  const categoryTotals = {};
  const monthlySpending = {};

  for (const tx of transactions) {
    if (tx.type !== 'debit') continue; // Only count expenses

    // Category totals
    const cat = tx.category;
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0, ...getCategoryMeta(cat) };
    }
    categoryTotals[cat].total += tx.amount;
    categoryTotals[cat].count += 1;

    // Monthly breakdown
    const monthKey = tx.date ? tx.date.substring(0, 7) : 'Unknown'; // YYYY-MM
    if (!monthlySpending[monthKey]) monthlySpending[monthKey] = {};
    if (!monthlySpending[monthKey][cat]) monthlySpending[monthKey][cat] = 0;
    monthlySpending[monthKey][cat] += tx.amount;
  }

  const totalSpend = Object.values(categoryTotals).reduce((s, c) => s + c.total, 0);

  // Add percentage to each category
  for (const cat of Object.values(categoryTotals)) {
    cat.percentage = totalSpend > 0 ? Math.round((cat.total / totalSpend) * 100) : 0;
    cat.total = Math.round(cat.total * 100) / 100;
  }

  return {
    categoryTotals,
    monthlySpending,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalTransactions: transactions.length,
    debitCount: transactions.filter(t => t.type === 'debit').length,
    creditCount: transactions.filter(t => t.type === 'credit').length,
  };
}

/**
 * Generate budget alerts based on spending patterns
 * @param {Object} summary
 * @returns {Array} alerts
 */
function generateAlerts(summary, budgetLimits = {}) {
  const alerts = [];
  const defaultBudgets = {
    Food: 5000,
    Shopping: 8000,
    Entertainment: 2000,
    Travel: 6000,
    Health: 3000,
    Bills: 4000,
    Education: 3000,
    Other: 2000,
  };

  const limits = { ...defaultBudgets, ...budgetLimits };

  for (const [cat, data] of Object.entries(summary.categoryTotals)) {
    const limit = limits[cat];
    if (!limit) continue;
    const overPercent = Math.round(((data.total - limit) / limit) * 100);

    if (data.total > limit) {
      alerts.push({
        type: 'danger',
        category: cat,
        icon: data.icon,
        message: `You exceeded your ${cat} budget by ₹${(data.total - limit).toFixed(0)} (${overPercent}% over)`,
        amount: data.total,
        limit,
      });
    } else if (data.total > limit * 0.8) {
      alerts.push({
        type: 'warning',
        category: cat,
        icon: data.icon,
        message: `${cat} spending at ${Math.round((data.total / limit) * 100)}% of your budget`,
        amount: data.total,
        limit,
      });
    }
  }

  return alerts;
}

module.exports = { categorize, getCategoryMeta, buildSummary, generateAlerts, CATEGORIES };

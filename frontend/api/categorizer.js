cat.total = Math.round(cat.total * 100) / 100;
  }
  return {
    categoryTotals, monthlySpending,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalTransactions: transactions.length,
    debitCount: transactions.filter(t => t.type === 'debit').length,
    creditCount: transactions.filter(t => t.type === 'credit').length,
  };
}

function generateAlerts(summary, budgetLimits = {}) {
  const alerts = [];
  const defaultBudgets = { Food: 5000, Shopping: 8000, Entertainment: 2000, Travel: 6000, Health: 3000, Bills: 4000, Education: 3000, Other: 2000 };
  const limits = { ...defaultBudgets, ...budgetLimits };
  for (const [cat, data] of Object.entries(summary.categoryTotals)) {
    const limit = limits[cat];
    if (!limit) continue;
    const overPercent = Math.round(((data.total - limit) / limit) * 100);
    if (data.total > limit) {
      alerts.push({ type: 'danger', category: cat, icon: data.icon, message: You exceeded your ${cat} budget by ₹${(data.total - limit).toFixed(0)} (${overPercent}% over), amount: data.total, limit });
    } else if (data.total > limit * 0.8) {
      alerts.push({ type: 'warning', category: cat, icon: data.icon, message: ${cat} spending at ${Math.round((data.total / limit) * 100)}% of your budget, amount: data.total, limit });
    }
  }
  return alerts;
}

module.exports = { categorize, getCategoryMeta, buildSummary, generateAlerts, CATEGORIES };

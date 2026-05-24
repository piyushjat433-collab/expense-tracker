import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Wallet } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function StatsBar({ summary, meta }) {
  const totalCredit = Object.values(summary.monthlySpending || {}).reduce((sum, month) => {
    // approximate credit from transaction data passed via props
    return sum;
  }, 0);

  const stats = [
    {
      icon: <ArrowDownLeft className="w-4 h-4 text-red-500" />,
      label: 'Total Spent',
      value: formatINR(summary.totalSpend),
      bg: 'bg-red-50',
    },
    {
      icon: <ReceiptText className="w-4 h-4 text-primary-500" />,
      label: 'Transactions',
      value: summary.debitCount,
      bg: 'bg-indigo-50',
    },
    {
      icon: <ArrowUpRight className="w-4 h-4 text-green-500" />,
      label: 'Credits',
      value: summary.creditCount,
      bg: 'bg-green-50',
    },
    {
      icon: <Wallet className="w-4 h-4 text-amber-500" />,
      label: 'Categories',
      value: Object.keys(summary.categoryTotals).length,
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={i} className={`stat-card ${s.bg} border-0`}>
          <div className="flex items-center gap-2">
            {s.icon}
            <span className="text-xs text-gray-500 font-medium">{s.label}</span>
          </div>
          <p className="text-xl font-extrabold text-gray-800">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

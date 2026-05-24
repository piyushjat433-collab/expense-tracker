import React from 'react';
import { RefreshCw, Info, ChevronRight } from 'lucide-react';
import SpendingChart from '../components/SpendingChart';
import TransactionList from '../components/TransactionList';
import BudgetAlerts from '../components/BudgetAlerts';
import StatsBar from '../components/StatsBar';
import { formatDate } from '../utils/format';

export default function Dashboard({ data, onReset }) {
  const { transactions, summary, alerts, meta } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Top Nav */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold text-gray-900">💰 SpendWise</h1>
            <p className="text-xs text-gray-400">
              {meta?.fileName || 'Bank Statement'} · {formatDate(meta?.parsedAt)}
              {meta?.isDemo && <span className="ml-1 badge bg-amber-50 text-amber-600">DEMO</span>}
            </p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Demo Banner */}
        {meta?.isDemo && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl animate-fade-in">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Viewing demo data. Upload your own PDF bank statement to analyze real transactions.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <StatsBar summary={summary} meta={meta} />
        </div>

        {/* Chart */}
        <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <SpendingChart summary={summary} />
        </div>

        {/* Budget Alerts */}
        <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <BudgetAlerts alerts={alerts} summary={summary} />
        </div>

        {/* Transactions */}
        <div className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <TransactionList transactions={transactions} />
        </div>

        <p className="text-center text-xs text-gray-300 py-4">
          Built with ❤️ for Throne8 Assignment · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

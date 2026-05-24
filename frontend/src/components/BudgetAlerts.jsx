import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function BudgetAlerts({ alerts, summary }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-3 text-base">💡 Budget Insights</h2>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Great job! 🎉</p>
            <p className="text-xs text-green-600">All categories within budget limits.</p>
          </div>
        </div>
      </div>
    );
  }

  const dangerous = alerts.filter(a => a.type === 'danger');
  const warnings = alerts.filter(a => a.type === 'warning');

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 text-base">💡 Budget Alerts</h2>
        <span className="badge bg-red-50 text-red-600">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {dangerous.map((alert, i) => (
          <AlertCard key={i} alert={alert} />
        ))}
        {warnings.map((alert, i) => (
          <AlertCard key={`w${i}`} alert={alert} />
        ))}
      </div>

      {/* Top spending category callout */}
      {summary?.categoryTotals && (() => {
        const topCat = Object.entries(summary.categoryTotals)
          .sort((a, b) => b[1].total - a[1].total)[0];
        if (!topCat) return null;
        return (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs font-semibold text-indigo-700">
              {topCat[1].icon} Your biggest expense: <strong>{topCat[0]}</strong>
            </p>
            <p className="text-xs text-indigo-500 mt-0.5">
              {formatINR(topCat[1].total)} — {topCat[1].percentage}% of total spend
            </p>
          </div>
        );
      })()}
    </div>
  );
}

function AlertCard({ alert }) {
  const isDanger = alert.type === 'danger';
  const overPercent = alert.limit ? Math.round((alert.amount / alert.limit) * 100) : 100;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${
      isDanger
        ? 'bg-red-50 border-red-100'
        : 'bg-amber-50 border-amber-100'
    }`}>
      {isDanger
        ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isDanger ? 'text-red-700' : 'text-amber-700'}`}>
          {alert.message}
        </p>
        {alert.limit && (
          <div className="mt-1.5">
            <div className="flex justify-between text-xs mb-1">
              <span className={isDanger ? 'text-red-400' : 'text-amber-400'}>Spent</span>
              <span className={isDanger ? 'text-red-400' : 'text-amber-400'}>Budget: ₹{alert.limit.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full bar-fill ${isDanger ? 'bg-red-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(overPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

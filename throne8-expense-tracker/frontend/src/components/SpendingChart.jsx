import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { formatINR } from '../utils/format';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-800">{d.name}</p>
      <p className="text-primary-600">{formatINR(d.value)}</p>
    </div>
  );
};

export default function SpendingChart({ summary }) {
  const [view, setView] = useState('pie');

  const pieData = Object.entries(summary.categoryTotals).map(([name, data]) => ({
    name,
    value: data.total,
    color: data.color,
    icon: data.icon,
  })).sort((a, b) => b.value - a.value);

  // Monthly bar chart data
  const months = Object.keys(summary.monthlySpending).sort();
  const barData = months.map(month => {
    const row = { month: month.substring(0, 7) };
    for (const [cat, val] of Object.entries(summary.monthlySpending[month])) {
      row[cat] = val;
    }
    return row;
  });

  const topCategories = pieData.slice(0, 5);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 text-base">Spending Breakdown</h2>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {['pie', 'bar'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {v === 'pie' ? '🥧 Pie' : '📊 Bar'}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="text-center mb-2">
        <p className="text-2xl font-extrabold text-gray-900">{formatINR(summary.totalSpend)}</p>
        <p className="text-xs text-gray-400">Total Expenses · {summary.debitCount} transactions</p>
      </div>

      {view === 'pie' ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-3 space-y-2">
            {topCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-xs text-gray-600 font-medium">{cat.icon} {cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bar-fill"
                      style={{ width: `${summary.categoryTotals[cat.name]?.percentage || 0}%`, background: cat.color }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-800 w-16 text-right">{formatINR(cat.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(val, name) => [formatINR(val), name]} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            {topCategories.map(cat => (
              <Bar key={cat.name} dataKey={cat.name} stackId="a" fill={cat.color} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

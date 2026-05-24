import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import { formatINR, relativeTime } from '../utils/format';

const CATEGORY_COLORS = {
  Food: '#FF6B6B',
  Travel: '#4ECDC4',
  Shopping: '#45B7D1',
  Entertainment: '#96CEB4',
  Health: '#FFEAA7',
  Bills: '#DDA0DD',
  Education: '#A29BFE',
  Transfer: '#74B9FF',
  Other: '#B2BEC3',
};

const CATEGORY_ICONS = {
  Food: '🍔', Travel: '✈️', Shopping: '🛍️', Entertainment: '🎬',
  Health: '💊', Bills: '📄', Education: '📚', Transfer: '💸', Other: '📦',
};

export default function TransactionList({ transactions }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const categories = ['All', ...new Set(transactions.map(t => t.category))];

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = !search || tx.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || tx.category === filterCategory;
      const matchType = filterType === 'All' || tx.type === filterType;
      return matchSearch && matchCat && matchType;
    });
  }, [transactions, search, filterCategory, filterType]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > paginated.length;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">Transactions</h2>
          <span className="badge bg-gray-100 text-gray-500">{filtered.length} of {transactions.length}</span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {/* Type filter */}
          {['All', 'debit', 'credit'].map(t => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filterType === t
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'
              }`}
            >
              {t === 'All' ? 'All' : t === 'debit' ? '↑ Debit' : '↓ Credit'}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 self-center flex-shrink-0" />
          {categories.filter(c => c !== 'All').map(cat => (
            <button
              key={cat}
              onClick={() => { setFilterCategory(filterCategory === cat ? 'All' : cat); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filterCategory === cat
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'
              }`}
              style={filterCategory === cat ? { background: CATEGORY_COLORS[cat] || '#5C6BC0', borderColor: CATEGORY_COLORS[cat] } : {}}
            >
              {CATEGORY_ICONS[cat] || '📦'} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction rows */}
      <div className="divide-y divide-gray-50">
        {paginated.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions match your filters</p>
          </div>
        ) : (
          paginated.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              {/* Category Icon Bubble */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: (CATEGORY_COLORS[tx.category] || '#B2BEC3') + '20' }}
              >
                {CATEGORY_ICONS[tx.category] || '📦'}
              </div>

              {/* Description + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{relativeTime(tx.date)}</span>
                  <span
                    className="badge text-xs px-1.5 py-0"
                    style={{ background: (CATEGORY_COLORS[tx.category] || '#B2BEC3') + '20', color: CATEGORY_COLORS[tx.category] || '#888' }}
                  >
                    {tx.category}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatINR(tx.amount)}
                </p>
                {tx.type === 'credit'
                  ? <TrendingUp className="w-3 h-3 text-green-400 ml-auto" />
                  : <TrendingDown className="w-3 h-3 text-red-400 ml-auto" />
                }
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-2.5 text-sm text-primary-600 font-semibold hover:bg-indigo-50 rounded-xl transition-colors"
          >
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

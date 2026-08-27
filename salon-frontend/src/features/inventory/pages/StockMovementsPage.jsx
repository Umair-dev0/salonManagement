import React, { useState } from 'react';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useStockMovements } from '../hooks/useInventory';

export default function StockMovementsPage({ productId }) {
  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState('');

  const { data, isLoading, isError, error, refetch } = useStockMovements(productId, {
    page,
    size: 15,
  });

  const movements = data?.content || [];
  const totalPages = data?.totalPages || 1;

  const filteredMovements = filterType
    ? movements.filter((m) => m.movementType === filterType)
    : movements;

  const getMovementBadge = (type, qty) => {
    const q = Number(qty || 0);
    const isPositive = q > 0;

    switch (type) {
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ArrowUpRight className="w-3.5 h-3.5" /> Purchase (+{q})
          </span>
        );
      case 'SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            <ArrowDownRight className="w-3.5 h-3.5" /> Sale ({q})
          </span>
        );
      case 'CONSUMPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ArrowDownRight className="w-3.5 h-3.5" /> Service Used ({q})
          </span>
        );
      case 'WASTAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <ArrowDownRight className="w-3.5 h-3.5" /> Wastage ({q})
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />} Adjustment ({q})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> Stock Audit Logs & Movement History
          </h2>
          <p className="text-xs text-slate-500">Immutable ledger of all stock additions, sales, service usage & wastage.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="">All Movement Types</option>
            <option value="PURCHASE">Purchase (Stock In)</option>
            <option value="SALE">Sale (Stock Out)</option>
            <option value="CONSUMPTION">Service Consumption</option>
            <option value="WASTAGE">Wastage</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-slate-500">Fetching movement ledger...</span>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading movement logs: {error?.message || 'Failed to fetch'}</span>
        </div>
      ) : filteredMovements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500">
          <p className="text-base font-semibold">No stock movements recorded</p>
          <p className="text-xs text-slate-400 mt-1">Movements will automatically record upon purchase, sale, or wastage.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Movement Type & Change</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Reason / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {movement.createdAt ? new Date(movement.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{movement.productName || `Product #${movement.productId}`}</div>
                      <div className="text-xs text-slate-400 font-mono">{movement.productSku}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getMovementBadge(movement.movementType, movement.quantity)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-700">
                      {movement.reference || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {movement.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-40">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

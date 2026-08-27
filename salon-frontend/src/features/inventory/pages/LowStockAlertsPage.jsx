import React, { useState } from 'react';
import { AlertTriangle, ShoppingCart, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useProducts } from '../hooks/useInventory';
import LowStockBadge from '../components/LowStockBadge';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import { formatMoney } from '../../../utils/formatMoney';

export default function LowStockAlertsPage() {
  const [selectedProductForPO, setSelectedProductForPO] = useState(null);

  const { data, isLoading, isError, error, refetch } = useProducts({
    lowStock: true,
    size: 50,
  });

  const lowStockProducts = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Critical Low Stock Inventory
          </h2>
          <p className="text-xs text-slate-500">Products requiring re-ordering or replenishment.</p>
        </div>
        <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-sm text-slate-500">Scanning low stock levels...</span>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading alerts: {error?.message || 'Failed to fetch'}</span>
        </div>
      ) : lowStockProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-500">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            ✓
          </div>
          <h3 className="text-base font-bold text-slate-800">All Stock Levels Healthy!</h3>
          <p className="text-xs text-slate-400 mt-1">No products are currently at or below reorder threshold.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lowStockProducts.map((product) => {
            const current = Number(product.currentStock || 0);
            const reorder = Number(product.reorderLevel || 0);
            const deficit = Math.max(0, reorder - current);

            return (
              <div key={product.id} className="bg-white rounded-2xl border border-amber-200/70 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                    </div>
                    <LowStockBadge currentStock={current} reorderLevel={reorder} isLowStock={product.isLowStock} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-amber-50/50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 block">Current Stock:</span>
                      <span className="font-bold text-amber-900 text-sm">{current} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Min Threshold:</span>
                      <span className="font-semibold text-slate-700">{reorder} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Deficit:</span>
                      <span className="font-bold text-rose-600">+{deficit} units needed</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Purchase Price:</span>
                      <span className="font-semibold text-slate-700">{formatMoney(product.purchasePrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProductForPO(product)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition mt-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Create Purchase Order
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* PO Modal */}
      <PurchaseOrderModal
        isOpen={Boolean(selectedProductForPO)}
        onClose={() => setSelectedProductForPO(null)}
        prefilledProduct={selectedProductForPO}
      />
    </div>
  );
}

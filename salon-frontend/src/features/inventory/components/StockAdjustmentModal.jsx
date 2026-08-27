import React, { useState } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { useRecordMovement } from '../hooks/useInventory';

export default function StockAdjustmentModal({ isOpen, onClose, product }) {
  const [movementType, setMovementType] = useState('PURCHASE');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const movementMutation = useRecordMovement();

  if (!isOpen || !product) return null;

  const currentStockNum = Number(product.currentStock || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const qtyNum = parseFloat(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if ((movementType === 'WASTAGE' || movementType === 'ADJUSTMENT') && !reason.trim()) {
      setErrorMsg(`Reason is mandatory for ${movementType} movements.`);
      return;
    }

    if (movementType === 'WASTAGE' && qtyNum > currentStockNum) {
      setErrorMsg(`Cannot remove ${qtyNum} units. Current stock is only ${currentStockNum}.`);
      return;
    }

    try {
      await movementMutation.mutateAsync({
        productId: product.id,
        movementData: {
          movementType,
          quantity: qtyNum,
          reference: reference.trim(),
          reason: reason.trim(),
        },
      });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record stock movement';
      setErrorMsg(msg);
    }
  };

  const isDeduction = movementType === 'WASTAGE' || (movementType === 'ADJUSTMENT' && parseFloat(quantity) < 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        style={{ width: '100%', maxWidth: '520px', minWidth: '300px', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100" style={{ width: '100%' }}>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Adjust Product Stock</h3>
            <p className="text-xs text-slate-500">{product.name} ({product.sku})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" style={{ width: '100%' }}>
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" style={{ width: '100%' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-sm" style={{ width: '100%' }}>
            <span className="text-indigo-900 font-medium">Current Stock Level:</span>
            <span className="text-lg font-bold text-indigo-700">{currentStockNum} units</span>
          </div>

          <div style={{ width: '100%' }}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type *</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
              style={{ width: '100%' }}
            >
              <option value="PURCHASE">Stock In (Purchase)</option>
              <option value="WASTAGE">Stock Out (Wastage / Damaged)</option>
              <option value="ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>

          <div style={{ width: '100%' }}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
            <div className="relative" style={{ width: '100%' }}>
              <input
                type="number"
                step="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter units count"
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
              <div className="absolute right-3 top-2.5 text-xs text-slate-400">
                {isDeduction ? (
                  <span className="text-rose-500 font-semibold flex items-center"><ArrowDownRight className="w-3.5 h-3.5" /> -Deduct</span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center"><ArrowUpRight className="w-3.5 h-3.5" /> +Add</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference (Invoice / PO #)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-2026-889"
              className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ width: '100%' }}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason {(movementType === 'WASTAGE' || movementType === 'ADJUSTMENT') && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={movementType === 'WASTAGE' ? 'e.g. Spilled / Expired bottle' : 'e.g. Physical inventory audit discrepancy'}
              className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              style={{ width: '100%' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6" style={{ width: '100%' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={movementMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {movementMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

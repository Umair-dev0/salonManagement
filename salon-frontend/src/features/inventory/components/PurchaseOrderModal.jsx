import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useSuppliers, useCreatePurchaseOrder } from '../hooks/useSuppliers';
import { useProducts } from '../hooks/useInventory';
import { formatMoney } from '../../../utils/formatMoney';

export default function PurchaseOrderModal({ isOpen, onClose, prefilledProduct }) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: productsData } = useProducts({ size: 100 });
  const products = productsData?.content || [];

  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const poMutation = useCreatePurchaseOrder();

  useEffect(() => {
    if (isOpen) {
      if (prefilledProduct) {
        setItems([{
          productId: prefilledProduct.id,
          quantity: Math.max(1, (prefilledProduct.reorderLevel || 10) - (prefilledProduct.currentStock || 0)),
          unitPrice: prefilledProduct.purchasePrice || 0,
        }]);
      } else {
        setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      }
      setSupplierId(suppliers[0]?.id || '');
      setErrorMsg('');
    }
  }, [isOpen, prefilledProduct, suppliers]);

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const prod = products.find((p) => String(p.id) === String(value));
        if (prod) {
          updated[index].unitPrice = prod.purchasePrice || 0;
        }
      }
      return updated;
    });
  };

  const totalOrderAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!supplierId) {
      setErrorMsg('Please select a supplier.');
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMsg('Please ensure all item rows have a selected product and valid quantity.');
      return;
    }

    try {
      await poMutation.mutateAsync({
        supplierId: parseInt(supplierId, 10),
        orderDate,
        items: items.map((i) => ({
          productId: parseInt(i.productId, 10),
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
        paymentStatus: 'PENDING',
      });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create Purchase Order';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        style={{ width: '100%', maxWidth: '760px', minWidth: '320px', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100" style={{ width: '100%' }}>
          <h3 className="text-xl font-bold text-slate-800">Create Purchase Order</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ width: '100%' }}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                style={{ width: '100%' }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.contactPerson || s.phone || 'Supplier'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date *</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Order Items *</label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto" style={{ width: '100%' }}>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60" style={{ width: '100%' }}>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-right"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-right"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-100/80 rounded-xl text-sm font-bold text-slate-800" style={{ width: '100%' }}>
            <span>Total Order Valuation:</span>
            <span className="text-indigo-600 text-base">{formatMoney(totalOrderAmount)}</span>
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
              disabled={poMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {poMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

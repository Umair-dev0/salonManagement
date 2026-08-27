import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateProduct, useUpdateProduct } from '../hooks/useInventory';

export default function ProductModal({ isOpen, onClose, productToEdit }) {
  const isEdit = Boolean(productToEdit?.id);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    category: '',
    purchasePrice: '',
    mrp: '',
    salePrice: '',
    gstPercent: '18.00',
    initialStock: '0.00',
    reorderLevel: '10.00',
  });

  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        sku: productToEdit.sku || '',
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || '',
        purchasePrice: productToEdit.purchasePrice || '',
        mrp: productToEdit.mrp || '',
        salePrice: productToEdit.salePrice || '',
        gstPercent: productToEdit.gstPercent || '18.00',
        initialStock: productToEdit.currentStock || '0.00',
        reorderLevel: productToEdit.reorderLevel || '10.00',
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        brand: '',
        category: '',
        purchasePrice: '',
        mrp: '',
        salePrice: '',
        gstPercent: '18.00',
        initialStock: '0.00',
        reorderLevel: '10.00',
      });
    }
    setErrorMsg('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice),
      mrp: parseFloat(formData.mrp),
      salePrice: parseFloat(formData.salePrice),
      gstPercent: parseFloat(formData.gstPercent),
      reorderLevel: parseFloat(formData.reorderLevel),
      initialStock: isEdit ? undefined : parseFloat(formData.initialStock || '0'),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: productToEdit.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      setErrorMsg(msg);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        style={{ width: '100%', maxWidth: '680px', minWidth: '300px', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100" style={{ width: '100%' }}>
          <h3 className="text-xl font-bold text-slate-800">
            {isEdit ? 'Edit Product' : 'Add New Inventory Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" style={{ width: '100%' }}>
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" style={{ width: '100%' }}>
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ width: '100%' }}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. SHAMP-001"
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="L'Oréal Keratin Shampoo"
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="L'Oréal Professional"
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Hair Care"
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                required
                value={formData.purchasePrice}
                onChange={handleChange}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">MRP (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="mrp"
                required
                value={formData.mrp}
                onChange={handleChange}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="salePrice"
                required
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST (%) *</label>
              <input
                type="number"
                step="0.01"
                name="gstPercent"
                required
                value={formData.gstPercent}
                onChange={handleChange}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  step="0.01"
                  name="initialStock"
                  value={formData.initialStock}
                  onChange={handleChange}
                  className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
              <input
                type="number"
                step="0.01"
                name="reorderLevel"
                required
                value={formData.reorderLevel}
                onChange={handleChange}
                className="w-full block px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                style={{ width: '100%' }}
              />
            </div>
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
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

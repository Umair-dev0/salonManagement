import React, { useState } from 'react';
import { Search, Plus, RefreshCw, Edit3, ArrowRightLeft, History, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useProducts, useDeleteProduct } from '../hooks/useInventory';
import LowStockBadge from '../components/LowStockBadge';
import ProductModal from '../components/ProductModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import { formatMoney } from '../../../utils/formatMoney';

export default function ProductListPage({ onSelectProductHistory }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(0);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    size: 10,
    search: search.trim() || undefined,
    category: category || undefined,
    lowStock: lowStockOnly || undefined,
  });

  const deleteMutation = useDeleteProduct();

  const products = data?.content || [];
  const totalPages = data?.totalPages || 1;

  const handleEdit = (product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This will mark it as inactive.`)) {
      try {
        await deleteMutation.mutateAsync(product.id);
        alert(`Product "${product.name}" deleted successfully.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, SKU, Brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Categories</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Skin Care">Skin Care</option>
            <option value="Color">Color & Dye</option>
            <option value="Nails">Nails</option>
            <option value="Tools">Equipment & Tools</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Low Stock Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Table & States */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-slate-500">Loading products catalogue...</span>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading products: {error?.message || 'Failed to fetch'}</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500">
          <p className="text-base font-semibold">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting search filters or create a new product.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">SKU / Product</th>
                  <th className="px-4 py-3">Brand & Category</th>
                  <th className="px-4 py-3 text-right">Purchase Price</th>
                  <th className="px-4 py-3 text-right">Sale Price</th>
                  <th className="px-4 py-3 text-center">Current Stock</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{product.brand || '—'}</div>
                      <div className="text-slate-400">{product.category || 'General'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(product.purchasePrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(product.salePrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800">{product.currentStock}</span>
                      <span className="text-xs text-slate-400 block">Min: {product.reorderLevel}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LowStockBadge currentStock={product.currentStock} reorderLevel={product.reorderLevel} isLowStock={product.isLowStock} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setAdjustingProduct(product)} title="Stock Adjustment" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => onSelectProductHistory && onSelectProductHistory(product.id)} title="Movement Logs" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                          <History className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(product)} title="Edit Product" className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          title="Delete Product"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-40">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-white border rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} productToEdit={productToEdit} />
      <StockAdjustmentModal isOpen={Boolean(adjustingProduct)} onClose={() => setAdjustingProduct(null)} product={adjustingProduct} />
    </div>
  );
}

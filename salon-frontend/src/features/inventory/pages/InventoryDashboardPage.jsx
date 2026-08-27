import React, { useState } from 'react';
import { Package, AlertTriangle, History, Truck, Layers, DollarSign, RefreshCw } from 'lucide-react';
import ProductListPage from './ProductListPage';
import LowStockAlertsPage from './LowStockAlertsPage';
import StockMovementsPage from './StockMovementsPage';
import SuppliersPage from './SuppliersPage';
import { useProducts } from '../hooks/useInventory';
import { usePurchaseOrders } from '../hooks/useSuppliers';
import { formatMoney } from '../../../utils/formatMoney';

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);

  const { data: productsData, isLoading: isLoadingProducts, refetch } = useProducts({ size: 100 });
  const { data: lowStockData } = useProducts({ lowStock: true, size: 100 });
  const { data: posData } = usePurchaseOrders({ size: 50 });

  const products = productsData?.content || [];
  const lowStockProducts = lowStockData?.content || [];
  const purchaseOrders = posData?.content || [];

  const totalStockValuation = products.reduce((sum, p) => {
    return sum + (Number(p.currentStock || 0) * Number(p.purchasePrice || 0));
  }, 0);

  const handleSelectProductHistory = (productId) => {
    setSelectedProductForHistory(productId);
    setActiveTab('movements');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" /> Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time stock audit, low-stock warnings, purchase orders & supplier ledger.</p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Metrics
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Products</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{isLoadingProducts ? '...' : products.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Stock Valuation</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{formatMoney(totalStockValuation)}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Low Stock Alerts</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{lowStockProducts.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Purchase Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{purchaseOrders.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" /> Products Catalogue
        </button>

        <button
          onClick={() => setActiveTab('low-stock')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'low-stock' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Low Stock Alerts ({lowStockProducts.length})
        </button>

        <button
          onClick={() => {
            setSelectedProductForHistory(null);
            setActiveTab('movements');
          }}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'movements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Stock Audit Logs
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'suppliers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Suppliers & POs
        </button>
      </div>

      {/* Active Tab View Rendering */}
      <div>
        {activeTab === 'products' && <ProductListPage onSelectProductHistory={handleSelectProductHistory} />}
        {activeTab === 'low-stock' && <LowStockAlertsPage />}
        {activeTab === 'movements' && <StockMovementsPage productId={selectedProductForHistory} />}
        {activeTab === 'suppliers' && <SuppliersPage />}
      </div>
    </div>
  );
}

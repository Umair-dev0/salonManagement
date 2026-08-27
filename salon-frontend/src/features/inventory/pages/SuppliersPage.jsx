import React, { useState } from 'react';
import { Truck, Plus, ShoppingCart, CheckCircle, Clock, Loader2, X } from 'lucide-react';
import { useSuppliers, usePurchaseOrders, useUpdatePOStatus, useCreateSupplier } from '../hooks/useSuppliers';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import { formatMoney } from '../../../utils/formatMoney';

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: posData, isLoading: isLoadingPOs } = usePurchaseOrders({ size: 20 });
  const updatePOStatusMutation = useUpdatePOStatus();
  const createSupplierMutation = useCreateSupplier();

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

  const purchaseOrders = posData?.content || [];

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await createSupplierMutation.mutateAsync(supplierForm);
      setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      setIsAddSupplierOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleMarkReceived = async (poId) => {
    if (window.confirm(`Mark Purchase Order #${poId} as RECEIVED? This will automatically add items into stock.`)) {
      try {
        await updatePOStatusMutation.mutateAsync({
          id: poId,
          data: { status: 'RECEIVED', paymentStatus: 'PAID' },
        });
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to mark PO as RECEIVED');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Suppliers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" /> Supplier Directory
            </h2>
            <p className="text-xs text-slate-500">Manage vendors and product manufacturers.</p>
          </div>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>

        {isLoadingSuppliers ? (
          <div className="flex items-center justify-center p-6 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            No suppliers added yet. Click "Add Supplier" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1 text-xs">
                <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                <p className="text-slate-600">Contact: {s.contactPerson || '—'}</p>
                <p className="text-slate-500">Phone: {s.phone || '—'} | Email: {s.email || '—'}</p>
                {s.address && <p className="text-slate-400 truncate">{s.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" /> Purchase Orders
            </h2>
            <p className="text-xs text-slate-500">Track incoming stock orders and receiving status.</p>
          </div>
          <button
            onClick={() => setIsPOModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        </div>

        {isLoadingPOs ? (
          <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            No purchase orders created yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">PO # / Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Total Valuation</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">PO-{po.id}</div>
                      <div className="text-xs text-slate-400">{po.orderDate}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{po.supplierName || `Supplier #${po.supplierId}`}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatMoney(po.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {po.status === 'RECEIVED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${po.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleMarkReceived(po.id)}
                          disabled={updatePOStatusMutation.isPending}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
            style={{ width: '100%', maxWidth: '520px', minWidth: '300px', boxSizing: 'border-box' }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100" style={{ width: '100%' }}>
              <h3 className="text-xl font-bold text-slate-800">Add Supplier</h3>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4" style={{ width: '100%' }}>
              <div style={{ width: '100%' }}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  required
                  placeholder="e.g. L'Oréal Professional Supplies"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full block px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ width: '100%' }}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                <input
                  placeholder="e.g. Rajesh Sharma"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full block px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ width: '100%' }}>
                <div style={{ width: '100%' }}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    placeholder="+91 9876543210"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full block px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ width: '100%' }}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@loreal.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full block px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ width: '100%' }}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  placeholder="Vendor address details..."
                  rows={3}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full block px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6" style={{ width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {createSupplierMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PurchaseOrderModal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} />
    </div>
  );
}

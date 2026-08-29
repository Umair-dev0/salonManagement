import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, Calendar, Users, AlertTriangle, TrendingUp,
    RefreshCw, Plus, ShoppingBag, Package, Clock, CheckCircle, CreditCard, ChevronRight
} from 'lucide-react';
import { getDashboardStats } from '../../api/dashboard';
import { formatMoney } from '../../utils/formatMoney';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        setIsLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load dashboard stats:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'BILLED':
                return { bg: '#dcfce7', color: '#166534', label: 'BILLED' };
            case 'COMPLETED':
                return { bg: '#e0f2fe', color: '#0369a1', label: 'COMPLETED' };
            case 'IN_SERVICE':
                return { bg: '#fef3c7', color: '#92400e', label: 'IN SERVICE' };
            case 'SCHEDULED':
            case 'CONFIRMED':
                return { bg: '#f3e8ff', color: '#6b21a8', label: 'SCHEDULED' };
            case 'CANCELLED':
                return { bg: '#fee2e2', color: '#991b1b', label: 'CANCELLED' };
            default:
                return { bg: '#f1f5f9', color: '#475569', label: status || 'UNKNOWN' };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header & Quick Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', color: '#78350f', margin: 0, fontSize: '24px', fontWeight: '800' }}>
                        Executive Analytics Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Real-time revenue performance, live session management, payment splits, and stock alerts.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        className="secondary-btn"
                        onClick={() => navigate('/dashboard/calendar')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                    >
                        <Calendar size={15} color="#b4833e" /> + Book Session
                    </button>

                    <button
                        className="secondary-btn"
                        onClick={() => navigate('/dashboard/billing')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                    >
                        <ShoppingBag size={15} color="#b4833e" /> + Direct Sale
                    </button>

                    <button
                        className="secondary-btn"
                        onClick={() => navigate('/dashboard/inventory')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                    >
                        <Package size={15} color="#b4833e" /> + Add Product
                    </button>

                    <button
                        className="primary-btn"
                        onClick={loadDashboardStats}
                        style={{ padding: '8px 12px', fontSize: '12px', backgroundColor: '#b4833e' }}
                    >
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>
            </div>

            {/* 4 Executive Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Card 1: Today's Revenue */}
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today's Revenue
                        </span>
                        <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '10px', color: '#b4833e' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: '#78350f', marginTop: '12px' }}>
                        {isLoading ? '...' : formatMoney(stats?.todaySales)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#b4833e', marginTop: '4px', fontWeight: '500' }}>
                        Real-time POS checkout revenue
                    </div>
                </div>

                {/* Card 2: Today's Appointments */}
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today's Sessions
                        </span>
                        <div style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px', color: '#475569' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: '#0f172a', marginTop: '12px' }}>
                        {isLoading ? '...' : stats?.todayAppointmentsTotal || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '6px' }}>
                        <span>Sched: <strong>{stats?.todayAppointmentsScheduled || 0}</strong></span>
                        <span>•</span>
                        <span>In-Svc: <strong>{stats?.todayAppointmentsInService || 0}</strong></span>
                        <span>•</span>
                        <span>Done: <strong>{(stats?.todayAppointmentsCompleted || 0) + (stats?.todayAppointmentsBilled || 0)}</strong></span>
                    </div>
                </div>

                {/* Card 3: Registered Clients */}
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Active Clients
                        </span>
                        <div style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px', color: '#475569' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: '#0f172a', marginTop: '12px' }}>
                        {isLoading ? '...' : stats?.totalClients || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Registered client base
                    </div>
                </div>

                {/* Card 4: Low Stock Alerts */}
                <div className="stat-card" style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: stats?.lowStockAlertCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    backgroundColor: stats?.lowStockAlertCount > 0 ? '#fef2f2' : '#ffffff'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: stats?.lowStockAlertCount > 0 ? '#991b1b' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Stock Alerts
                        </span>
                        <div style={{ padding: '8px', backgroundColor: stats?.lowStockAlertCount > 0 ? '#fee2e2' : '#f1f5f9', borderRadius: '10px', color: stats?.lowStockAlertCount > 0 ? '#dc2626' : '#475569' }}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: stats?.lowStockAlertCount > 0 ? '#991b1b' : '#0f172a', marginTop: '12px' }}>
                        {isLoading ? '...' : stats?.lowStockAlertCount || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: stats?.lowStockAlertCount > 0 ? '#b91c1c' : '#64748b', marginTop: '4px', fontWeight: '500' }}>
                        {stats?.lowStockAlertCount > 0 ? 'Items require immediate reordering!' : 'All stock levels healthy'}
                    </div>
                </div>
            </div>

            {/* Main Section: Live Sessions Table + Side Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Today's Live Sessions Table */}
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#78350f', fontFamily: 'var(--font-serif)', fontWeight: '700' }}>
                                Today's Live Sessions & Walk-Ins
                            </h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Real-time appointments scheduled for today
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/calendar')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b4833e', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                            View Calendar <ChevronRight size={14} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading sessions...</div>
                    ) : !stats?.todaySessions || stats.todaySessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>
                            No appointments scheduled for today.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                    <th style={{ padding: '8px 0' }}>Client</th>
                                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Time</th>
                                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.todaySessions.map(session => {
                                    const st = getStatusStyle(session.status);
                                    return (
                                        <tr key={session.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                                            <td style={{ padding: '10px 0' }}>
                                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{session.customerName}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{session.customerMobile}</div>
                                            </td>
                                            <td style={{ padding: '10px 0', textAlign: 'center', fontWeight: '500' }}>
                                                {session.startTime ? session.startTime.slice(0, 5) : 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px 0', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: st.bg,
                                                    color: st.color
                                                }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700' }}>
                                                {formatMoney(session.total ?? session.totalAmount ?? 0)}
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Right Side Widgets: Payment Mode Breakdown & Critical Stock Warning */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Payment Mode Breakdown Widget */}
                    <div className="stat-card" style={{ padding: '20px', borderRadius: '16px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#78350f', fontFamily: 'var(--font-serif)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CreditCard size={16} color="#b4833e" /> Payment Mode Breakdown
                        </h3>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '12px' }}>Loading payment split...</div>
                        ) : !stats?.paymentModeSplit || stats.paymentModeSplit.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                                No payments recorded today.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stats.paymentModeSplit.map(pm => (
                                    <div key={pm.paymentMode} style={{ fontSize: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '600', color: '#334155' }}>{pm.paymentMode} ({pm.count} txns)</span>
                                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatMoney(pm.amount)} ({pm.percentage}%)</span>
                                        </div>
                                        <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(100, Math.max(0, pm.percentage))}%`,
                                                backgroundColor: pm.paymentMode === 'CASH' ? '#166534' : pm.paymentMode === 'UPI' ? '#b4833e' : '#0284c7',
                                                borderRadius: '3px'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Critical Low Stock Banner */}
                    <div className="stat-card" style={{
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: '#78350f', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={16} color="#b4833e" /> Critical Reorder Items
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard/inventory')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b4833e', fontSize: '11px', fontWeight: 'bold' }}
                            >
                                Inventory Page →
                            </button>
                        </div>

                        {!stats?.criticalInventoryItems || stats.criticalInventoryItems.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                                All product stock levels are above reorder limits.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                                {stats.criticalInventoryItems.map(prod => (
                                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #fde68a' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#78350f' }}>{prod.name}</div>
                                            <div style={{ color: '#92400e' }}>SKU: {prod.sku}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#b91c1c', fontWeight: '800' }}>{prod.currentStock} left</div>
                                            <div style={{ color: '#64748b' }}>Limit: {prod.reorderLevel}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

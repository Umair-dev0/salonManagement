import React, { useState, useEffect, useCallback } from 'react';
import {
    Award, Shield, Crown, Ticket, Gift, Plus, Search, RefreshCw, X,
    Calendar, CheckCircle, AlertCircle, Trash2, Edit, UserPlus, DollarSign, Percent, Clock
} from 'lucide-react';
import {
    getMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
    getCustomerMemberships, subscribeCustomerPlan,
    getCoupons, createCoupon, updateCoupon, deleteCoupon,
    getAllLoyaltyLedger
} from '../../../api/membership';
import { getCustomers } from '../../../api/customers';
import { formatMoney } from '../../../utils/formatMoney';

export default function MembershipPage() {
    const [activeTab, setActiveTab] = useState('PLANS'); // PLANS, SUBSCRIPTIONS, COUPONS, LEDGER

    // Data States
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [planModalMode, setPlanModalMode] = useState('CREATE'); // CREATE | EDIT
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        name: '', tier: 'GOLD', price: '', discountPercent: '', walletValue: '', validityDays: '365'
    });

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [subForm, setSubForm] = useState({ customerId: '', planId: '' });

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponForm, setCouponForm] = useState({
        code: '', discountType: 'PERCENT', value: '', minBillAmount: '', maxDiscount: '', maxUses: '', validTo: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (activeTab === 'PLANS') {
                const data = await getMembershipPlans();
                setPlans(data || []);
            } else if (activeTab === 'SUBSCRIPTIONS') {
                const [subsData, custData, plansData] = await Promise.all([
                    getCustomerMemberships(),
                    getCustomers(),
                    getMembershipPlans()
                ]);
                setSubscriptions(subsData || []);
                setCustomers(custData?.content || custData || []);
                setPlans(plansData || []);
            } else if (activeTab === 'COUPONS') {
                const data = await getCoupons();
                setCoupons(data || []);
            } else if (activeTab === 'LEDGER') {
                const data = await getAllLoyaltyLedger();
                setLedger(data || []);
            }
        } catch (err) {
            console.error('Failed to load membership data:', err);
            setError('Failed to load data. Please retry.');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ==========================================
    // PLAN MODAL HANDLERS
    // ==========================================
    const openCreatePlanModal = () => {
        setEditingPlan(null);
        setPlanForm({ name: '', tier: 'GOLD', price: '', discountPercent: '', walletValue: '', validityDays: '365' });
        setPlanModalMode('CREATE');
        setIsPlanModalOpen(true);
    };

    const openEditPlanModal = (plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            tier: plan.tier,
            price: plan.price,
            discountPercent: plan.discountPercent,
            walletValue: plan.walletValue,
            validityDays: plan.validityDays
        });
        setPlanModalMode('EDIT');
        setIsPlanModalOpen(true);
    };

    const handlePlanSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: planForm.name,
                tier: planForm.tier,
                price: parseFloat(planForm.price),
                discountPercent: parseFloat(planForm.discountPercent || 0),
                walletValue: parseFloat(planForm.walletValue || 0),
                validityDays: parseInt(planForm.validityDays || 365)
            };

            if (planModalMode === 'CREATE') {
                await createMembershipPlan(payload);
            } else {
                await updateMembershipPlan(editingPlan.id, payload);
            }
            setIsPlanModalOpen(false);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save membership plan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Deactivate this membership plan?')) {
            try {
                await deleteMembershipPlan(id);
                loadData();
            } catch {
                alert('Failed to deactivate plan.');
            }
        }
    };

    // ==========================================
    // SUBSCRIPTION HANDLERS
    // ==========================================
    const handleSubscribeSubmit = async (e) => {
        e.preventDefault();
        if (!subForm.customerId || !subForm.planId) {
            alert('Please select both a customer and a membership plan.');
            return;
        }
        setIsSubmitting(true);
        try {
            await subscribeCustomerPlan({
                customerId: Number(subForm.customerId),
                planId: Number(subForm.planId)
            });
            setIsSubModalOpen(false);
            setSubForm({ customerId: '', planId: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to subscribe client.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // COUPON HANDLERS
    // ==========================================
    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                code: couponForm.code,
                discountType: couponForm.discountType,
                value: parseFloat(couponForm.value),
                minBillAmount: couponForm.minBillAmount ? parseFloat(couponForm.minBillAmount) : 0,
                maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
                maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
                validTo: couponForm.validTo ? new Date(couponForm.validTo).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString()
            };

            await createCoupon(payload);
            setIsCouponModalOpen(false);
            setCouponForm({ code: '', discountType: 'PERCENT', value: '', minBillAmount: '', maxDiscount: '', maxUses: '', validTo: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create coupon.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (window.confirm('Deactivate this coupon code?')) {
            try {
                await deleteCoupon(id);
                loadData();
            } catch {
                alert('Failed to deactivate coupon.');
            }
        }
    };

    // Helper for tier color badges
    const getTierBadge = (tier) => {
        const t = (tier || '').toUpperCase();
        if (t === 'PLATINUM') return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
        if (t === 'ELITE' || t === 'ROYAL') return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
        return { bg: '#fffbeb', color: '#b4833e', border: '#fde68a' }; // GOLD / default
    };

    return (
        <div className="crm-container">
            {/* Header */}
            <div className="crm-header">
                <div className="greeting">
                    <h1>Memberships & Loyalty Hub</h1>
                    <p>Manage VIP membership plans, client subscriptions, coupons, and points ledger audit.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {activeTab === 'PLANS' && (
                        <button className="primary-btn" onClick={openCreatePlanModal}>
                            <Plus size={18} /> Create Plan
                        </button>
                    )}
                    {activeTab === 'SUBSCRIPTIONS' && (
                        <button className="primary-btn" onClick={() => setIsSubModalOpen(true)}>
                            <UserPlus size={18} /> Subscribe Client
                        </button>
                    )}
                    {activeTab === 'COUPONS' && (
                        <button className="primary-btn" onClick={() => setIsCouponModalOpen(true)}>
                            <Plus size={18} /> Create Coupon
                        </button>
                    )}
                    <button className="secondary-btn" onClick={loadData} style={{ padding: '10px' }}>
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '12px',
                borderBottom: '2px solid var(--border-color)',
                marginBottom: '20px',
                marginTop: '16px'
            }}>
                {[
                    { id: 'PLANS', label: 'Membership Plans', icon: Crown },
                    { id: 'SUBSCRIPTIONS', label: 'Active Subscriptions', icon: Award },
                    { id: 'COUPONS', label: 'Coupons & Promos', icon: Ticket },
                    { id: 'LEDGER', label: 'Loyalty Ledger Audit', icon: Gift }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                border: 'none',
                                borderBottom: isActive ? '3px solid var(--primary-gold-dark)' : '3px solid transparent',
                                backgroundColor: 'transparent',
                                color: isActive ? 'var(--primary-gold-dark)' : 'var(--text-muted)',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Workspace */}
            {isLoading ? (
                <div className="stat-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="crm-spinner" style={{ margin: '0 auto 12px auto' }} />
                    <p>Loading membership records...</p>
                </div>
            ) : error ? (
                <div className="stat-card" style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>
                    <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
                    <p>{error}</p>
                    <button className="primary-btn" onClick={loadData} style={{ margin: '12px auto 0 auto' }}>Retry</button>
                </div>
            ) : (
                <>
                    {/* TAB 1: MEMBERSHIP PLANS */}
                    {activeTab === 'PLANS' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {plans.length === 0 ? (
                                <div className="stat-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Crown size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                                    <h3>No membership plans defined yet</h3>
                                    <p>Create your first VIP Tier plan to reward repeat clients.</p>
                                </div>
                            ) : (
                                plans.map(plan => {
                                    const badge = getTierBadge(plan.tier);
                                    return (
                                        <div
                                            key={plan.id}
                                            className="stat-card"
                                            style={{
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justify: 'space-between',
                                                border: `1px solid ${badge.border}`,
                                                backgroundColor: plan.active ? 'var(--bg-card)' : '#f8fafc',
                                                opacity: plan.active ? 1 : 0.6
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        padding: '3px 10px',
                                                        borderRadius: '12px',
                                                        backgroundColor: badge.bg,
                                                        color: badge.color,
                                                        border: `1px solid ${badge.border}`
                                                    }}>
                                                        {plan.tier} TIER
                                                    </span>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: plan.active ? '#15803d' : '#94a3b8' }}>
                                                        {plan.active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </div>

                                                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: '0 0 8px 0', color: 'var(--primary-gold-dark)' }}>
                                                    {plan.name}
                                                </h2>

                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '16px' }}>
                                                    {formatMoney(plan.price)}
                                                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}> / {plan.validityDays} days</span>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Percent size={14} color="var(--primary-gold-dark)" />
                                                        <strong>{plan.discountPercent}% OFF</strong> on all services
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Gift size={14} color="var(--primary-gold-dark)" />
                                                        <strong>{formatMoney(plan.walletValue)}</strong> initial wallet balance
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                                <button
                                                    onClick={() => openEditPlanModal(plan)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-gold-dark)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                {plan.active && (
                                                    <button
                                                        onClick={() => handleDeletePlan(plan.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                    >
                                                        <Trash2 size={14} /> Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* TAB 2: ACTIVE SUBSCRIPTIONS */}
                    {activeTab === 'SUBSCRIPTIONS' && (
                        <div className="stat-card" style={{ padding: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Client</th>
                                        <th style={{ padding: '10px' }}>Tier Plan</th>
                                        <th style={{ padding: '10px' }}>Discount %</th>
                                        <th style={{ padding: '10px' }}>Start Date</th>
                                        <th style={{ padding: '10px' }}>Expiry Date</th>
                                        <th style={{ padding: '10px' }}>Wallet Balance</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                                No client memberships subscribed yet. Click "+ Subscribe Client" to assign a plan.
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions.map(sub => {
                                            const badge = getTierBadge(sub.tier);
                                            const isExpired = new Date(sub.expiryDate) < new Date();
                                            return (
                                                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>
                                                        {sub.customerName}
                                                        <div style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                                                            {sub.customerMobile}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            backgroundColor: badge.bg,
                                                            color: badge.color,
                                                            border: `1px solid ${badge.border}`
                                                        }}>
                                                            {sub.tier} - {sub.planName}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 10px', fontWeight: '600' }}>{sub.discountPercent}% OFF</td>
                                                    <td style={{ padding: '12px 10px' }}>{new Date(sub.startDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px 10px' }}>{new Date(sub.expiryDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: 'var(--primary-gold-dark)' }}>{formatMoney(sub.walletBalance)}</td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: !isExpired && sub.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                                            color: !isExpired && sub.status === 'ACTIVE' ? '#166534' : '#991b1b'
                                                        }}>
                                                            {!isExpired && sub.status === 'ACTIVE' ? 'ACTIVE' : 'EXPIRED'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 3: COUPONS & PROMO CODES */}
                    {activeTab === 'COUPONS' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {coupons.length === 0 ? (
                                <div className="stat-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Ticket size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                                    <h3>No promo coupons created yet</h3>
                                    <p>Create discount codes to run promotional marketing campaigns.</p>
                                </div>
                            ) : (
                                coupons.map(cp => (
                                    <div
                                        key={cp.id}
                                        className="stat-card"
                                        style={{
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justify: 'space-between',
                                            border: '1px dashed var(--primary-gold)',
                                            backgroundColor: cp.active ? '#fffdfa' : '#f8fafc',
                                            opacity: cp.active ? 1 : 0.6
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'rgba(197, 160, 89, 0.15)',
                                                    color: 'var(--primary-gold-dark)',
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {cp.code}
                                                </span>
                                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: cp.active ? '#15803d' : '#94a3b8' }}>
                                                    {cp.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: '12px 0 6px 0' }}>
                                                {cp.discountType === 'PERCENT' ? `${cp.value}% OFF` : `Flat ${formatMoney(cp.value)} OFF`}
                                            </div>

                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div>Min Bill: <strong>{formatMoney(cp.minBillAmount)}</strong></div>
                                                {cp.maxDiscount && <div>Max Discount: <strong>{formatMoney(cp.maxDiscount)}</strong></div>}
                                                <div>Uses: <strong>{cp.usedCount}</strong> {cp.maxUses ? `/ ${cp.maxUses}` : '(Unlimited)'}</div>
                                                <div>Valid till: <strong>{new Date(cp.validTo).toLocaleDateString()}</strong></div>
                                            </div>
                                        </div>

                                        {cp.active && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                                                <button
                                                    onClick={() => handleDeleteCoupon(cp.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Trash2 size={13} /> Deactivate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 4: LOYALTY POINTS LEDGER AUDIT */}
                    {activeTab === 'LEDGER' && (
                        <div className="stat-card" style={{ padding: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Date</th>
                                        <th style={{ padding: '10px' }}>Client</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Type</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Points</th>
                                        <th style={{ padding: '10px' }}>Invoice #</th>
                                        <th style={{ padding: '10px' }}>Audit Description / Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                                No loyalty point transactions logged yet. Points earn automatically when bills are marked paid.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledger.map(row => (
                                            <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                                                    {new Date(row.createdAt).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.customerName}</td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: row.txnType === 'EARN' ? '#dcfce7' : '#fee2e2',
                                                        color: row.txnType === 'EARN' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {row.txnType}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    textAlign: 'right',
                                                    fontWeight: 'bold',
                                                    color: row.txnType === 'EARN' ? '#166534' : '#b91c1c'
                                                }}>
                                                    {row.txnType === 'EARN' ? `+${row.points}` : `-${row.points}`}
                                                </td>
                                                <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                                                    {row.invoiceNumber || '—'}
                                                </td>
                                                <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{row.notes}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* MODAL 1: CREATE / EDIT MEMBERSHIP PLAN */}
            {isPlanModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{planModalMode === 'CREATE' ? 'Create Membership Plan' : 'Edit Membership Plan'}</h2>
                            <button className="close-btn" onClick={() => setIsPlanModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePlanSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Plan Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Gold Privilege Club"
                                        value={planForm.name}
                                        onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tier Category *</label>
                                    <select
                                        className="form-control"
                                        value={planForm.tier}
                                        onChange={e => setPlanForm({ ...planForm, tier: e.target.value })}
                                    >
                                        <option value="GOLD">GOLD Tier</option>
                                        <option value="PLATINUM">PLATINUM Tier</option>
                                        <option value="ELITE">ELITE Tier</option>
                                        <option value="SILVER">SILVER Tier</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Plan Price (₹) *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="2500"
                                        value={planForm.price}
                                        onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Discount Percent (%)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="10"
                                        value={planForm.discountPercent}
                                        onChange={e => setPlanForm({ ...planForm, discountPercent: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Initial Wallet Credit (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="500"
                                        value={planForm.walletValue}
                                        onChange={e => setPlanForm({ ...planForm, walletValue: e.target.value })}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Validity Duration (Days)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="365"
                                        value={planForm.validityDays}
                                        onChange={e => setPlanForm({ ...planForm, validityDays: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsPlanModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: SUBSCRIBE CLIENT */}
            {isSubModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h2>Subscribe Client to Membership</h2>
                            <button className="close-btn" onClick={() => setIsSubModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubscribeSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Customer *</label>
                                    <select
                                        className="form-control"
                                        value={subForm.customerId}
                                        onChange={e => setSubForm({ ...subForm, customerId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Client --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.fullName} ({c.mobile})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Select Membership Tier Plan *</label>
                                    <select
                                        className="form-control"
                                        value={subForm.planId}
                                        onChange={e => setSubForm({ ...subForm, planId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Tier Plan --</option>
                                        {plans.filter(p => p.active).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} [{p.tier}] - {formatMoney(p.price)} ({p.discountPercent}% OFF)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsSubModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Subscribing...' : 'Activate Subscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: CREATE COUPON */}
            {isCouponModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Create Promo Coupon</h2>
                            <button className="close-btn" onClick={() => setIsCouponModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCouponSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. LUXE20"
                                        value={couponForm.code}
                                        onChange={e => setCouponForm({ ...couponForm, code: e.target.value })}
                                        required
                                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Discount Type *</label>
                                    <select
                                        className="form-control"
                                        value={couponForm.discountType}
                                        onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}
                                    >
                                        <option value="PERCENT">PERCENT (%)</option>
                                        <option value="FLAT">FLAT AMOUNT (₹)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Discount Value *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="10 or 500"
                                        value={couponForm.value}
                                        onChange={e => setCouponForm({ ...couponForm, value: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Min Bill Threshold (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="500"
                                        value={couponForm.minBillAmount}
                                        onChange={e => setCouponForm({ ...couponForm, minBillAmount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Max Uses (Global)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="100"
                                        value={couponForm.maxUses}
                                        onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Valid Until Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={couponForm.validTo}
                                        onChange={e => setCouponForm({ ...couponForm, validTo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsCouponModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

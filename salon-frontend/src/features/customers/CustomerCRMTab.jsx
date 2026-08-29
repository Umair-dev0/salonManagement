import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Search, X, Edit, Trash2,
    Phone, Mail, MapPin, Star, Calendar, TrendingUp,
    ChevronRight, Filter, Download, Eye, AlertCircle,
    Gift, Clock, Heart, Crown
} from 'lucide-react';
import {
    getCustomers, createCustomer,
    updateCustomer, deleteCustomer, getCustomerHistory
} from '../../api/customers';
import { getMembershipPlans, subscribeCustomerPlan } from '../../api/membership';
import { formatMoney } from '../../utils/formatMoney';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name = '') => {
    const colors = [
        '#775a19', '#c5a059', '#4a7c59', '#6b4c9a',
        '#c4622d', '#2d7d9a', '#9a2d5f', '#3d7a4a'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const formatCurrency = (amount) => {
    if (!amount) return '₨ 0';
    return `₨ ${Number(amount).toLocaleString('en-PK')}`;
};

// ==========================================
// CUSTOMER CARD COMPONENT
// ==========================================

const CustomerCard = ({ customer, onClick }) => {
    const initials = getInitials(customer.fullName);
    const avatarColor = getAvatarColor(customer.fullName);

    return (
        <div className="customer-card" onClick={() => onClick(customer)}>
            <div className="customer-card-top">
                <div className="customer-avatar" style={{ backgroundColor: avatarColor }}>
                    {initials}
                </div>
                <div className="customer-card-info">
                    <h3 className="customer-name">{customer.fullName}</h3>
                    <p className="customer-phone">{customer.mobile || '—'}</p>
                </div>
                <span className={`status-badge ${customer.active ? 'status-active' : 'status-inactive'}`}>
                    {customer.active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="customer-card-stats">
                <div className="customer-stat">
                    <Star size={13} />
                    <span>{customer.loyaltyPoints || 0} pts</span>
                </div>
                <div className="customer-stat">
                    <Clock size={13} />
                    <span>{customer.totalVisits || 0} visits</span>
                </div>
                <div className="customer-stat">
                    <TrendingUp size={13} />
                    <span>{formatCurrency(customer.totalSpent)}</span>
                </div>
            </div>

            {customer.lastVisitDate && (
                <p className="customer-last-visit">
                    Last visit: {formatDate(customer.lastVisitDate)}
                </p>
            )}
        </div>
    );
};

// ==========================================
// CUSTOMER DETAIL PANEL
// ==========================================

const CustomerDetailPanel = ({ customer, history, isHistoryLoading, onClose, onEdit, onDelete, onAssignMembership }) => {
    if (!customer) return null;
    const avatarColor = getAvatarColor(customer.fullName);

    return (
        <div className="customer-detail-panel">
            <div className="detail-panel-header">
                <h2>Customer Profile</h2>
                <button className="close-btn" onClick={onClose}><X size={22} /></button>
            </div>

            {/* Avatar & Name Block */}
            <div className="detail-avatar-block">
                <div className="detail-avatar" style={{ backgroundColor: avatarColor }}>
                    {getInitials(customer.fullName)}
                </div>
                <div>
                    <h2 className="detail-name">{customer.fullName}</h2>
                    {customer.gender && (
                        <span className="detail-gender-badge">{customer.gender}</span>
                    )}
                    <span className={`status-badge ${customer.active ? 'status-active' : 'status-inactive'}`}
                        style={{ marginLeft: '8px' }}>
                        {customer.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="detail-stats-row">
                <div className="detail-stat-item">
                    <div className="detail-stat-value">{customer.loyaltyPoints || 0}</div>
                    <div className="detail-stat-label">
                        <Gift size={12} /> Loyalty Pts
                    </div>
                </div>
                <div className="detail-stat-item">
                    <div className="detail-stat-value">
                        {isHistoryLoading ? '...' : (history?.totalVisits ?? 0)}
                    </div>
                    <div className="detail-stat-label">
                        <Clock size={12} /> Total Visits
                    </div>
                </div>
                <div className="detail-stat-item">
                    <div className="detail-stat-value" style={{ fontSize: '15px' }}>
                        {isHistoryLoading ? '...' : formatCurrency(history?.totalSpent ?? 0)}
                    </div>
                    <div className="detail-stat-label">
                        <TrendingUp size={12} /> Total Spent
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="detail-section">
                <h4 className="detail-section-title">Contact Information</h4>
                <div className="detail-info-grid">
                    <div className="detail-info-row">
                        <Phone size={15} className="detail-info-icon" />
                        <div>
                            <div className="detail-info-label">Mobile</div>
                            <div className="detail-info-value">{customer.mobile || '—'}</div>
                        </div>
                    </div>
                    <div className="detail-info-row">
                        <Mail size={15} className="detail-info-icon" />
                        <div>
                            <div className="detail-info-label">Email</div>
                            <div className="detail-info-value">{customer.email || '—'}</div>
                        </div>
                    </div>
                    <div className="detail-info-row">
                        <Calendar size={15} className="detail-info-icon" />
                        <div>
                            <div className="detail-info-label">Date of Birth</div>
                            <div className="detail-info-value">{formatDate(customer.dateOfBirth)}</div>
                        </div>
                    </div>
                    {customer.anniversary && (
                        <div className="detail-info-row">
                            <Heart size={15} className="detail-info-icon" />
                            <div>
                                <div className="detail-info-label">Anniversary</div>
                                <div className="detail-info-value">{formatDate(customer.anniversary)}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Visit Info */}
            <div className="detail-section">
                <h4 className="detail-section-title">Visit History</h4>
                <div className="detail-info-row">
                    <Clock size={15} className="detail-info-icon" />
                    <div>
                        <div className="detail-info-label">Last Visit</div>
                        <div className="detail-info-value">
                            {isHistoryLoading ? 'Loading...' : formatDate(history?.lastVisitDate)}
                        </div>
                    </div>
                </div>
                <div className="detail-info-row" style={{ marginTop: '12px' }}>
                    <Calendar size={15} className="detail-info-icon" />
                    <div>
                        <div className="detail-info-label">Customer Since</div>
                        <div className="detail-info-value">{formatDate(customer.createdAt)}</div>
                    </div>
                </div>
            </div>

            {/* Preferences & Health */}
            {(customer.allergies || customer.notes) && (
                <div className="detail-section">
                    <h4 className="detail-section-title">Preferences & Health</h4>
                    {customer.allergies && (
                        <div style={{ marginBottom: '12px' }}>
                            <div className="detail-info-label" style={{ color: '#c62828' }}>Allergies / Sensitivities</div>
                            <div className="detail-notes-box" style={{ backgroundColor: 'rgba(198, 40, 40, 0.05)', color: '#c62828', fontStyle: 'normal' }}>
                                {customer.allergies}
                            </div>
                        </div>
                    )}
                    {customer.notes && (
                        <div>
                            <div className="detail-info-label">Internal Notes</div>
                            <div className="detail-notes-box">{customer.notes}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
                <button className="danger-btn" onClick={() => onDelete(customer.id)}>
                    <Trash2 size={15} style={{ marginRight: '4px' }} />
                    Deactivate
                </button>
                <button
                    className="secondary-btn"
                    onClick={() => onAssignMembership(customer)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffdfa', border: '1px solid #fde68a', color: '#b4833e', fontWeight: 'bold' }}
                >
                    <Crown size={14} /> Assign VIP Membership
                </button>
                <button className="primary-btn" onClick={() => onEdit(customer)}>
                    <Edit size={15} />
                    Edit Customer
                </button>
            </div>
        </div>
    );
};

// ==========================================
// ASSIGN MEMBERSHIP MODAL COMPONENT
// ==========================================

const AssignMembershipModal = ({ customer, onClose, onSuccess }) => {
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [referenceNo, setReferenceNo] = useState('');
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await getMembershipPlans();
                const activePlans = (data || []).filter(p => p.active);
                setPlans(activePlans);
                if (activePlans.length > 0) {
                    setSelectedPlanId(activePlans[0].id);
                }
            } catch (err) {
                console.error("Failed to load membership plans:", err);
            } finally {
                setIsLoadingPlans(false);
            }
        };
        loadPlans();
    }, []);

    const selectedPlan = plans.find(p => p.id === Number(selectedPlanId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPlan) {
            alert("Please select a valid membership plan.");
            return;
        }

        setIsSubmitting(true);
        try {
            await subscribeCustomerPlan({
                customerId: customer.id,
                planId: selectedPlan.id
            });

            alert(`Membership Activated Successfully!\n\nClient: ${customer.fullName}\nPlan: ${selectedPlan.name} (${selectedPlan.tier} Tier)\nPayment Collected: ${formatMoney(selectedPlan.price)} via ${paymentMode}${referenceNo ? ` (Ref: ${referenceNo})` : ''}\nDiscount Benefit: ${selectedPlan.discountPercent}% OFF on all services!\nWallet Balance: ${formatMoney(selectedPlan.walletValue)}`);
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign membership.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-gold-dark)' }}>
                        <Crown size={20} color="#b4833e" /> Assign VIP Membership
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={22} /></button>
                </div>

                {isLoadingPlans ? (
                    <div style={{ padding: '30px', textAlign: 'center' }}>
                        <div className="crm-spinner" style={{ margin: '0 auto 12px auto' }} />
                        <p>Loading membership tier plans...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Billed Client:</div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {customer.fullName} ({customer.mobile})
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label style={{ fontWeight: 'bold' }}>1. Select Membership Tier Plan *</label>
                                <select
                                    className="form-control"
                                    value={selectedPlanId}
                                    onChange={e => setSelectedPlanId(e.target.value)}
                                    required
                                >
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} [{p.tier}] - {formatMoney(p.price)} ({p.discountPercent}% OFF)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedPlan && (
                                <div className="full-width" style={{
                                    backgroundColor: '#fffdfa',
                                    border: '1px solid #fde68a',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    fontSize: '13px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#78350f' }}>
                                        <span>Plan Amount to Collect:</span>
                                        <span style={{ fontSize: '16px' }}>{formatMoney(selectedPlan.price)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Member Benefit:</span>
                                        <span style={{ fontWeight: 'bold', color: '#15803d' }}>{selectedPlan.discountPercent}% OFF on all services</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Initial Wallet Credit:</span>
                                        <span style={{ fontWeight: 'bold', color: 'var(--primary-gold-dark)' }}>{formatMoney(selectedPlan.walletValue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Validity Period:</span>
                                        <span>{selectedPlan.validityDays} days</span>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>2. Payment Mode *</label>
                                <select
                                    className="form-control"
                                    value={paymentMode}
                                    onChange={e => setPaymentMode(e.target.value)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="UPI">UPI (QR/App)</option>
                                    <option value="NET_BANKING">Net Banking</option>
                                    <option value="WALLET">Wallet</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Txn Reference No (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. UPI-987654"
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="primary-btn" disabled={isSubmitting || !selectedPlan}>
                                <Crown size={16} />
                                {isSubmitting ? 'Processing...' : `Collect ${selectedPlan ? formatMoney(selectedPlan.price) : ''} & Activate`}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// ==========================================
// CUSTOMER FORM MODAL
// ==========================================

const CustomerFormModal = ({ mode, initialData, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || '',
        mobile: initialData?.mobile || '',
        email: initialData?.email || '',
        gender: initialData?.gender || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        anniversary: initialData?.anniversary || '',
        allergies: initialData?.allergies || '',
        notes: initialData?.notes || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(
            Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
        );
        onSubmit(payload);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>{mode === 'CREATE' ? 'New Customer' : 'Edit Customer'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-control"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. Ayesha Khan"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile"
                                className="form-control"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="e.g. 03001234567"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. ayesha@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                className="form-control"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">— Select Gender —</option>
                                <option value="FEMALE">Female</option>
                                <option value="MALE">Male</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                className="form-control"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Anniversary</label>
                            <input
                                type="date"
                                name="anniversary"
                                className="form-control"
                                value={formData.anniversary}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Allergies / Sensitivities</label>
                            <input
                                type="text"
                                name="allergies"
                                className="form-control"
                                value={formData.allergies}
                                onChange={handleChange}
                                placeholder="Allergies or chemical sensitivities"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Internal Notes</label>
                            <textarea
                                name="notes"
                                className="form-control"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Preferences, allergies, special requests..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" disabled={isLoading}>
                            <UserPlus size={16} />
                            {isLoading ? 'Saving...' : mode === 'CREATE' ? 'Add Customer' : 'Update Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ==========================================
// MAIN CUSTOMER CRM TAB
// ==========================================

export default function CustomerCRMTab() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGender, setFilterGender] = useState('ALL');

    // Panel & modal state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE');
    const [editTarget, setEditTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Assign Membership Modal State
    const [isAssignMemOpen, setIsAssignMemOpen] = useState(false);
    const [assignMemCustomer, setAssignMemCustomer] = useState(null);

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCustomers();
            setCustomers(data?.content || data || []);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            setError('Failed to load customers. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // ==========================================
    // SEARCH & FILTER LOGIC
    // ==========================================

    useEffect(() => {
        let result = [...customers];

        if (filterGender !== 'ALL') {
            result = result.filter(c => c.gender === filterGender);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.fullName?.toLowerCase().includes(q) ||
                c.mobile?.includes(q) ||
                c.email?.toLowerCase().includes(q)
            );
        }

        setFilteredCustomers(result);
    }, [customers, searchQuery, filterGender]);

    // ==========================================
    // STATS SUMMARY
    // ==========================================

    const totalCustomers = customers.length;
    const totalLoyaltyPoints = customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);
    const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    const repeatCustomers = customers.filter(c => (c.totalVisits || 0) > 1).length;

    // ==========================================
    // HANDLERS
    // ==========================================

    const handleCardClick = async (customer) => {
        setSelectedCustomer(customer);
        setSelectedCustomerHistory(null);
        setIsHistoryLoading(true);
        try {
            const history = await getCustomerHistory(customer.id);
            setSelectedCustomerHistory(history);
        } catch (err) {
            console.error("Failed to load customer history:", err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditTarget(null);
        setModalMode('CREATE');
        setIsModalOpen(true);
    };

    const openEditModal = (customer) => {
        setEditTarget(customer);
        setModalMode('EDIT');
        setIsModalOpen(true);
        setSelectedCustomer(null);
    };

    const handleAssignMembership = (customer) => {
        setAssignMemCustomer(customer);
        setIsAssignMemOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            if (modalMode === 'CREATE') {
                await createCustomer(formData);
            } else {
                await updateCustomer(editTarget.id, formData);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors && typeof responseData.errors === 'object') {
                const validationErrors = Object.entries(responseData.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('\n');
                alert(`Validation failed:\n${validationErrors}`);
            } else {
                alert(responseData?.message || 'Something went wrong!');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deactivate this customer? Their history will be preserved.')) {
            try {
                await deleteCustomer(id);
                setSelectedCustomer(null);
                fetchCustomers();
            } catch {
                alert('Failed to deactivate customer.');
            }
        }
    };

    return (
        <div className="crm-container">

            {/* ---- PAGE HEADER ---- */}
            <div className="crm-header">
                <div className="greeting">
                    <h1>Customer CRM</h1>
                    <p>Manage profiles, loyalty points & visit history.</p>
                </div>
                <button className="primary-btn" onClick={openCreateModal}>
                    <UserPlus size={18} />
                    New Customer
                </button>
            </div>

            {/* ---- SUMMARY STATS ---- */}
            <div className="crm-stats-row">
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(119,90,25,0.1)' }}>
                        <Users size={20} color="var(--primary-gold-dark)" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{totalCustomers}</div>
                        <div className="crm-stat-label">Total Customers</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(74,124,89,0.1)' }}>
                        <Heart size={20} color="#4a7c59" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{repeatCustomers}</div>
                        <div className="crm-stat-label">Repeat Customers</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(197,160,89,0.1)' }}>
                        <Gift size={20} color="#c5a059" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{totalLoyaltyPoints.toLocaleString()}</div>
                        <div className="crm-stat-label">Total Loyalty Points</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(45,125,154,0.1)' }}>
                        <TrendingUp size={20} color="#2d7d9a" />
                    </div>
                    <div>
                        <div className="crm-stat-value" style={{ fontSize: '18px' }}>
                            {formatCurrency(totalRevenue)}
                        </div>
                        <div className="crm-stat-label">Lifetime Revenue</div>
                    </div>
                </div>
            </div>

            {/* ---- SEARCH & FILTER BAR ---- */}
            <div className="crm-toolbar">
                <div className="crm-search-wrapper">
                    <Search size={16} className="crm-search-icon" />
                    <input
                        type="text"
                        className="crm-search-input"
                        placeholder="Search by name, phone, or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="crm-clear-search" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="crm-filter-group">
                    <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                    {['ALL', 'FEMALE', 'MALE', 'OTHER'].map(g => (
                        <button
                            key={g}
                            className={`crm-filter-pill ${filterGender === g ? 'active' : ''}`}
                            onClick={() => setFilterGender(g)}
                        >
                            {g === 'ALL' ? 'All' : g.charAt(0) + g.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ---- RESULTS COUNT ---- */}
            <div className="crm-results-bar">
                <span>{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found</span>
            </div>

            {/* ---- MAIN LAYOUT (Grid + Detail Panel) ---- */}
            <div className={`crm-main-layout ${selectedCustomer ? 'panel-open' : ''}`}>

                {/* Customer Grid */}
                <div className="crm-grid-area">
                    {isLoading ? (
                        <div className="crm-loading">
                            <div className="crm-spinner" />
                            <p>Loading customers...</p>
                        </div>
                    ) : error ? (
                        <div className="crm-error-state">
                            <AlertCircle size={40} color="#c62828" />
                            <p>{error}</p>
                            <button className="primary-btn" onClick={fetchCustomers}>Retry</button>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="crm-empty-state">
                            <Users size={48} color="var(--text-muted)" />
                            <h3>No customers found</h3>
                            <p>{searchQuery ? 'Try a different search term.' : 'Add your first customer to get started.'}</p>
                            {!searchQuery && (
                                <button className="primary-btn" onClick={openCreateModal}>
                                    <UserPlus size={16} /> Add First Customer
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="customer-grid">
                            {filteredCustomers.map(customer => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedCustomer && (
                    <CustomerDetailPanel
                        customer={selectedCustomer}
                        history={selectedCustomerHistory}
                        isHistoryLoading={isHistoryLoading}
                        onClose={() => setSelectedCustomer(null)}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onAssignMembership={handleAssignMembership}
                    />
                )}
            </div>

            {/* ---- CUSTOMER FORM MODAL ---- */}
            {isModalOpen && (
                <CustomerFormModal
                    mode={modalMode}
                    initialData={editTarget}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleFormSubmit}
                    isLoading={isSubmitting}
                />
            )}

            {/* ---- ASSIGN MEMBERSHIP PAYMENT MODAL ---- */}
            {isAssignMemOpen && assignMemCustomer && (
                <AssignMembershipModal
                    customer={assignMemCustomer}
                    onClose={() => setIsAssignMemOpen(false)}
                    onSuccess={() => {
                        setIsAssignMemOpen(false);
                        fetchCustomers();
                    }}
                />
            )}
        </div>
    );
}

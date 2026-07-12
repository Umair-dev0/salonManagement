// src/features/services/ComboPackagesPage.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Check, Percent, X, AlertCircle, HelpCircle, Edit, Trash2, RotateCcw, Search, Clock } from 'lucide-react';
import { getPackagesAPI, createPackageAPI, updatePackageAPI, deletePackageAPI, restorePackageAPI } from '../../api/packages';
import { getServicesAPI } from '../../api/services';
import { formatMoney } from '../../utils/formatMoney';
import { useAuth } from '../../context/AuthContext';
import './ComboPackagesPage.css';

// Skeleton Loader component for smooth package loading
const PackageSkeleton = () => (
    <div className="packages-grid">
        {[1, 2, 3].map(n => (
            <div key={n} className="package-card skeleton-card">
                <div className="package-card-header">
                    <div className="skeleton-pulse" style={{ width: '160px', height: '24px', borderRadius: '4px' }}></div>
                    <div className="status-badge skeleton-pulse" style={{ width: '60px', height: '20px' }}></div>
                </div>
                <div className="skeleton-pulse" style={{ width: '120px', height: '36px', borderRadius: '4px', margin: '16px 0 8px' }}></div>
                <div className="skeleton-pulse" style={{ width: '60px', height: '16px', borderRadius: '4px', marginBottom: '16px' }}></div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div className="skeleton-pulse" style={{ width: '100%', height: '14px', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '80%', height: '14px', borderRadius: '4px' }}></div>
                </div>
            </div>
        ))}
    </div>
);

export default function ComboPackagesPage() {
    const { user } = useAuth();
    const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';

    // API & UI States
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' or 'EDIT'
    const [editingPackageId, setEditingPackageId] = useState(null);
    const [filterType, setFilterType] = useState('ACTIVE'); // 'ACTIVE', 'INACTIVE', 'ALL'
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [form, setForm] = useState({
        name: '',
        packagePrice: '',
        gstPercent: 18.00,
        serviceIds: []
    });

    const loadData = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const pkgRes = await getPackagesAPI(true); // Fetch active and inactive packages
            const servRes = await getServicesAPI();
            setPackages(pkgRes.data || pkgRes || []);
            setServices(servRes.data || servRes || []);
        } catch (err) {
            console.error("Failed to load packages data:", err);
            setErrorMessage(err.response?.data?.message || 'Failed to load combo packages.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handle service ID checkbox toggles
    const handleServiceToggle = (serviceId) => {
        setForm(prev => {
            const ids = [...prev.serviceIds];
            const index = ids.indexOf(serviceId);
            if (index > -1) {
                ids.splice(index, 1);
            } else {
                ids.push(serviceId);
            }
            return { ...prev, serviceIds: ids };
        });
    };

    // Form submit for create or update
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (form.serviceIds.length === 0) {
            setErrorMessage('Please select at least one service to include in this combo package.');
            return;
        }

        try {
            const payload = {
                name: form.name.trim(),
                packagePrice: Number(form.packagePrice),
                gstPercent: Number(form.gstPercent),
                serviceIds: form.serviceIds
            };

            if (modalMode === 'CREATE') {
                await createPackageAPI(payload);
            } else {
                await updatePackageAPI(editingPackageId, payload);
            }

            setIsModalOpen(false);
            setForm({ name: '', packagePrice: '', gstPercent: 18.00, serviceIds: [] });
            loadData();
        } catch (err) {
            setErrorMessage(err.response?.data?.message || `Failed to ${modalMode === 'CREATE' ? 'create' : 'update'} combo package.`);
        }
    };

    const openCreateModal = () => {
        setForm({ name: '', packagePrice: '', gstPercent: 18.00, serviceIds: [] });
        setModalMode('CREATE');
        setEditingPackageId(null);
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const openEditModal = (pkg) => {
        setForm({
            name: pkg.name || '',
            packagePrice: pkg.packagePrice != null ? String(pkg.packagePrice) : '',
            gstPercent: pkg.gstPercent != null ? String(pkg.gstPercent) : '18.00',
            serviceIds: pkg.serviceIds || []
        });
        setModalMode('EDIT');
        setEditingPackageId(pkg.id);
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleDeactivate = async (id) => {
        if (window.confirm("Are you sure you want to deactivate this combo package?")) {
            setErrorMessage('');
            try {
                await deletePackageAPI(id);
                loadData();
            } catch (err) {
                setErrorMessage(err.response?.data?.message || 'Failed to deactivate combo package.');
            }
        }
    };

    const handleRestore = async (id) => {
        if (window.confirm("Are you sure you want to restore/reactivate this combo package?")) {
            setErrorMessage('');
            try {
                await restorePackageAPI(id);
                loadData();
            } catch (err) {
                setErrorMessage(err.response?.data?.message || 'Failed to restore combo package.');
            }
        }
    };

    // Helper to resolve service names
    const getServiceNamesList = (serviceIds) => {
        return serviceIds
            .map(id => services.find(s => s.id === id))
            .filter(Boolean);
    };

    // Filter packages by searchQuery AND filterType
    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterType === 'ACTIVE') {
            return pkg.isActive && matchesSearch;
        } else if (filterType === 'INACTIVE') {
            return !pkg.isActive && matchesSearch;
        }
        return matchesSearch; // 'ALL'
    });

    return (
        <div className="combo-packages-wrapper">
            <div className="packages-header-row">
                <div className="packages-title-area">
                    <h1>Combo Packages</h1>
                    <p>Create and manage premium bundled services for weddings, grooms, and glowing suites.</p>
                </div>
                {isOwner && (
                    <button className="primary-btn flex-btn" onClick={openCreateModal}>
                        <Plus size={16} /> Create Combo Package
                    </button>
                )}
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="packages-filter-row">
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filterType === 'ACTIVE' ? 'active' : ''}`} 
                        onClick={() => setFilterType('ACTIVE')}
                    >
                        Active ({packages.filter(p => p.isActive).length})
                    </button>
                    <button 
                        className={`filter-tab ${filterType === 'INACTIVE' ? 'active' : ''}`} 
                        onClick={() => setFilterType('INACTIVE')}
                    >
                        Deactivated ({packages.filter(p => !p.isActive).length})
                    </button>
                    <button 
                        className={`filter-tab ${filterType === 'ALL' ? 'active' : ''}`} 
                        onClick={() => setFilterType('ALL')}
                    >
                        All ({packages.length})
                    </button>
                </div>
                <div className="packages-search-box">
                    <Search size={16} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search combo packages..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {errorMessage && (
                <div className="packages-error-alert">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                    <button className="alert-close" onClick={() => setErrorMessage('')}><X size={16} /></button>
                </div>
            )}

            {isLoading && packages.length === 0 ? (
                <PackageSkeleton />
            ) : filteredPackages.length === 0 ? (
                <div className="empty-packages-state">
                    <HelpCircle size={48} className="empty-icon" />
                    <h4>No combo packages found</h4>
                    <p>Try resetting filters, searching something else, or creating a new package here.</p>
                    {isOwner && filterType === 'ACTIVE' && (
                        <button className="primary-btn inline-btn" onClick={openCreateModal}>
                            <Plus size={16} /> Create Package
                        </button>
                    )}
                </div>
            ) : (
                <div className="packages-grid">
                    {filteredPackages.map((pkg, index) => {
                        const attachedServices = getServiceNamesList(pkg.serviceIds || []);
                        return (
                            <div 
                                key={pkg.id} 
                                className={`package-card ${!pkg.isActive ? 'card-inactive' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="package-card-header">
                                    <div className="package-title-col">
                                        <h3 className="package-name">{pkg.name}</h3>
                                        <span className={`status-pill ${pkg.isActive ? 'active' : 'inactive'}`}>
                                            {pkg.isActive ? 'Active' : 'Deactivated'}
                                        </span>
                                    </div>
                                    {isOwner && (
                                        <div className="package-actions" onClick={(e) => e.stopPropagation()}>
                                            {pkg.isActive ? (
                                                <>
                                                    <button 
                                                        className="card-action-btn edit-btn" 
                                                        title="Edit Package" 
                                                        onClick={() => openEditModal(pkg)}
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        className="card-action-btn delete-btn" 
                                                        title="Deactivate Package" 
                                                        onClick={() => handleDeactivate(pkg.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    className="card-action-btn restore-btn" 
                                                    title="Restore Package" 
                                                    onClick={() => handleRestore(pkg.id)}
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>Restore</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="package-info-row">
                                    <div className="package-price-col">
                                        <span className="price-label">Package Price</span>
                                        <span className="price-value">{formatMoney(pkg.packagePrice)}</span>
                                    </div>
                                    {pkg.totalDurationMinutes != null && (
                                        <div className="package-duration-col">
                                            <span className="duration-label">Total Time</span>
                                            <span className="duration-value">
                                                <Clock size={15} className="duration-icon" style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                                                <span>{pkg.totalDurationMinutes} mins</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="package-tax-badge">
                                    <Percent size={11} />
                                    <span>{pkg.gstPercent}% GST Included</span>
                                </div>

                                <div className="package-services-section">
                                    <h4>Included Services</h4>
                                    {attachedServices.length === 0 ? (
                                        <p className="no-services-msg">No base services linked.</p>
                                    ) : (
                                        <ul className="attached-services-list">
                                            {attachedServices.map(s => (
                                                <li key={s.id} className="attached-service-item">
                                                    <Check size={14} className="check-icon" />
                                                    <span className="service-name">{s.name}</span>
                                                    <span className="service-duration">({s.durationMinutes}m)</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- CREATE / EDIT PACKAGE MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content package-modal-width text-left">
                        <div className="modal-header">
                            <h2>{modalMode === 'CREATE' ? 'New Combo Package' : 'Edit Combo Package'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Package Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        placeholder="e.g. Elegant Bridal Luxe Package, Groom's Clean Cut Combo"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Package Price (₹)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={form.packagePrice}
                                        onChange={(e) => setForm(prev => ({ ...prev, packagePrice: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Percent (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="form-control"
                                        value={form.gstPercent}
                                        onChange={(e) => setForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="checkbox-section-label">Select Services to Include</label>
                                    {services.length === 0 ? (
                                        <p className="no-services-warning">No base services found. Please create services first.</p>
                                    ) : (
                                        <div className="services-selection-grid">
                                            {services.map(s => {
                                                const isChecked = form.serviceIds.includes(s.id);
                                                return (
                                                    <div 
                                                        key={s.id} 
                                                        className={`service-checkbox-card ${isChecked ? 'selected' : ''}`}
                                                        onClick={() => handleServiceToggle(s.id)}
                                                    >
                                                        <div className="custom-checkbox">
                                                            {isChecked && <Check size={12} />}
                                                        </div>
                                                        <div className="service-checkbox-details">
                                                            <span className="name">{s.name}</span>
                                                            <span className="price-dur">{formatMoney(s.basePrice)} • {s.durationMinutes} mins</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    {modalMode === 'CREATE' ? 'Create Package' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

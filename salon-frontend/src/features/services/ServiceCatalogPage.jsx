// src/features/services/ServiceCatalogPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Folder, Plus, Search, Clock,
    Scissors, Percent, X, AlertCircle, HelpCircle,
    ChevronDown, ChevronRight, Edit, Trash2
} from 'lucide-react';
import {
    getCategoriesAPI,
    createCategoryAPI,
    getServicesAPI,
    createServiceAPI,
    updateServiceAPI,
    deleteServiceAPI
} from '../../api/services';
import { formatMoney } from '../../utils/formatMoney';
import { useAuth } from '../../context/AuthContext';
import './ServiceCatalogPage.css';

export default function ServiceCatalogPage() {
    // API States
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Selected States & Collapsible Categories State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // User role check
    const { user } = useAuth();
    const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';

    // Modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceModalMode, setServiceModalMode] = useState('CREATE'); // 'CREATE' or 'EDIT'
    const [editingServiceId, setEditingServiceId] = useState(null);

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '' });
    const [serviceForm, setServiceForm] = useState({
        name: '',
        description: '',
        basePrice: '',
        memberPrice: '',
        weekendPrice: '',
        durationMinutes: 30,
        gstPercent: 18.00,
        categoryId: ''
    });

    // Load data
    const loadCatalog = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const catRes = await getCategoriesAPI();
            const servRes = await getServicesAPI();

            const fetchedCategories = catRes.data || catRes || [];
            setCategories(fetchedCategories);
            setServices(servRes.data || servRes || []);

            // Default selected and expanded category to the first one
            if (fetchedCategories.length > 0) {
                const firstCat = fetchedCategories[0];
                if (!selectedCategory) {
                    setSelectedCategory(firstCat);
                    setExpandedCategories(prev => ({
                        ...prev,
                        [firstCat.id]: true
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to load catalog:", err);
            setErrorMessage(err.response?.data?.message || 'Error loading catalogue. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCatalog();
    }, []);

    // Toggle expand/collapse state
    const toggleExpand = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    // Clicking a parent category selects it AND toggles collapse
    const handleParentCategoryClick = (cat) => {
        setSelectedCategory(cat);
        toggleExpand(cat.id);
    };

    // Create Category submit
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        try {
            const payload = {
                name: categoryForm.name.trim(),
                parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null
            };
            const response = await createCategoryAPI(payload);
            setIsCategoryModalOpen(false);
            setCategoryForm({ name: '', parentId: '' });

            // If we created a subcategory, auto-expand the parent
            if (payload.parentId) {
                setExpandedCategories(prev => ({
                    ...prev,
                    [payload.parentId]: true
                }));
            }
            loadCatalog();
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to create category.');
        }
    };

    // Create or Update Service submit
    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        try {
            const payload = {
                categoryId: Number(serviceForm.categoryId),
                name: serviceForm.name.trim(),
                description: serviceForm.description ? serviceForm.description.trim() : null,
                basePrice: Number(serviceForm.basePrice),
                memberPrice: serviceForm.memberPrice ? Number(serviceForm.memberPrice) : null,
                weekendPrice: serviceForm.weekendPrice ? Number(serviceForm.weekendPrice) : null,
                durationMinutes: Number(serviceForm.durationMinutes),
                gstPercent: Number(serviceForm.gstPercent)
            };

            if (serviceModalMode === 'CREATE') {
                await createServiceAPI(payload);
            } else {
                await updateServiceAPI(editingServiceId, payload);
            }

            setIsServiceModalOpen(false);
            setServiceForm({
                name: '',
                description: '',
                basePrice: '',
                memberPrice: '',
                weekendPrice: '',
                durationMinutes: 30,
                gstPercent: 18.00,
                categoryId: selectedCategory?.id || ''
            });
            loadCatalog();
        } catch (err) {
            setErrorMessage(err.response?.data?.message || `Failed to ${serviceModalMode === 'CREATE' ? 'create' : 'update'} service.`);
        }
    };

    // Category tree filter helper
    const getCategoryIdsToFilter = (category) => {
        if (!category) return [];
        const ids = [category.id];
        if (category.subCategories) {
            category.subCategories.forEach(sub => ids.push(sub.id));
        }
        return ids;
    };

    const activeFilterIds = getCategoryIdsToFilter(selectedCategory);

    // Filter services based on category and search query
    const filteredServices = services.filter(service => {
        const matchesCategory = activeFilterIds.includes(service.categoryId);
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const openCreateCategory = (parentId = '') => {
        setCategoryForm({ name: '', parentId: parentId });
        setIsCategoryModalOpen(true);
    };

    const openCreateService = () => {
        setServiceForm({
            name: '',
            description: '',
            basePrice: '',
            memberPrice: '',
            weekendPrice: '',
            durationMinutes: 30,
            gstPercent: 18.00,
            categoryId: selectedCategory?.id || ''
        });
        setServiceModalMode('CREATE');
        setEditingServiceId(null);
        setIsServiceModalOpen(true);
    };

    const openEditServiceModal = (service) => {
        setServiceForm({
            name: service.name || '',
            description: service.description || '',
            basePrice: service.basePrice != null ? String(service.basePrice) : '',
            memberPrice: service.memberPrice != null ? String(service.memberPrice) : '',
            weekendPrice: service.weekendPrice != null ? String(service.weekendPrice) : '',
            durationMinutes: service.durationMinutes || 30,
            gstPercent: service.gstPercent != null ? String(service.gstPercent) : '18.00',
            categoryId: service.categoryId || ''
        });
        setServiceModalMode('EDIT');
        setEditingServiceId(service.id);
        setIsServiceModalOpen(true);
    };

    const handleDeleteService = async (serviceId) => {
        if (window.confirm("Are you sure you want to deactivate/delete this service?")) {
            setErrorMessage('');
            try {
                await deleteServiceAPI(serviceId);
                loadCatalog();
            } catch (err) {
                setErrorMessage(err.response?.data?.message || 'Failed to delete service.');
            }
        }
    };

    return (
        <div className="service-catalog-wrapper">
            <div className="catalog-header-row">
                <div className="catalog-title-area">
                    <h1>Service Catalog</h1>
                    <p>Organize salon treatments, adjust pricing structure, and set durations.</p>
                </div>
                <div className="catalog-action-row">
                    <button className="secondary-btn flex-btn" onClick={() => openCreateCategory()}>
                        <Plus size={16} /> New Category
                    </button>
                    <button className="primary-btn flex-btn" onClick={openCreateService}>
                        <Plus size={16} /> New Service
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div className="catalog-error-alert">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                    <button className="alert-close" onClick={() => setErrorMessage('')}><X size={16} /></button>
                </div>
            )}

            <div className="catalog-split-layout">
                {/* Left Panel - Categories Tree with Collapsible Main Categories */}
                <div className="categories-sidebar-panel">
                    <div className="panel-section-header">
                        <h3>Categories</h3>
                    </div>
                    {isLoading && categories.length === 0 ? (
                        <p className="loading-placeholder">Loading categories...</p>
                    ) : categories.length === 0 ? (
                        <p className="empty-placeholder">No categories created yet.</p>
                    ) : (
                        <div className="categories-tree-list">
                            {categories.map(cat => {
                                const isSelected = selectedCategory?.id === cat.id;
                                const hasSubs = cat.subCategories && cat.subCategories.length > 0;
                                const isExpanded = !!expandedCategories[cat.id];

                                return (
                                    <div key={cat.id} className="tree-category-group">
                                        <div
                                            className={`tree-category-item parent-cat ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleParentCategoryClick(cat)}
                                        >
                                            {/* Expand/Collapse Chevron Indicator */}
                                            {hasSubs ? (
                                                isExpanded ? (
                                                    <ChevronDown size={14} className="chevron-icon" />
                                                ) : (
                                                    <ChevronRight size={14} className="chevron-icon" />
                                                )
                                            ) : (
                                                <span className="chevron-placeholder"></span>
                                            )}

                                            <Folder size={16} className="tree-icon" />
                                            <span className="cat-name">{cat.name}</span>

                                            <button
                                                className="add-sub-cat-trigger"
                                                title="Add Subcategory"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openCreateCategory(cat.id);
                                                }}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        {/* Collapsible Subcategories list */}
                                        {hasSubs && isExpanded && (
                                            <div className="tree-sub-list">
                                                {cat.subCategories.map(subCat => {
                                                    const isSubSelected = selectedCategory?.id === subCat.id;
                                                    return (
                                                        <div
                                                            key={subCat.id}
                                                            className={`tree-category-item child-cat ${isSubSelected ? 'active' : ''}`}
                                                            onClick={() => setSelectedCategory(subCat)}
                                                        >
                                                            <Scissors size={14} className="tree-icon" />
                                                            <span className="cat-name">{subCat.name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel - Services Table */}
                <div className="services-content-panel">
                    <div className="services-panel-header">
                        <div className="selected-category-details">
                            <h3>{selectedCategory ? selectedCategory.name : 'All Services'}</h3>
                            <span className="services-count-pill">{filteredServices.length} Services</span>
                        </div>
                        <div className="services-search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search services..."
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

                    {isLoading && services.length === 0 ? (
                        <p className="loading-placeholder">Loading services...</p>
                    ) : filteredServices.length === 0 ? (
                        <div className="empty-catalog-state">
                            <HelpCircle size={48} className="empty-icon" />
                            <h4>No services found</h4>
                            <p>Try resetting filters, searching something else, or creating a new service here.</p>
                            <button className="primary-btn inline-btn" onClick={openCreateService}>
                                <Plus size={16} /> Create Service
                            </button>
                        </div>
                    ) : (
                        <div className="services-table-container">
                            <table className="catalog-table">
                                <thead>
                                    <tr>
                                        <th>Service Details</th>
                                        <th>Duration</th>
                                        <th>Base Price</th>
                                        <th>Member Price</th>
                                        <th>Weekend Price</th>
                                        <th>GST Rate</th>
                                        <th>Status</th>
                                        {isOwner && <th style={{ textAlign: 'center' }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map(service => (
                                        <tr key={service.id}>
                                            <td>
                                                <div className="service-cell-info">
                                                    <span className="service-cell-name">{service.name}</span>
                                                    {service.description && (
                                                        <span className="service-cell-desc">{service.description}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="duration-badge">
                                                    <Clock size={12} />
                                                    <span>{service.durationMinutes} mins</span>
                                                </div>
                                            </td>
                                            <td className="price-text bold">{formatMoney(service.basePrice)}</td>
                                            <td className="price-text member-discount">
                                                {service.memberPrice ? formatMoney(service.memberPrice) : '—'}
                                            </td>
                                            <td className="price-text weekend-rate">
                                                {service.weekendPrice ? formatMoney(service.weekendPrice) : '—'}
                                            </td>
                                            <td>
                                                <div className="gst-badge">
                                                    <Percent size={11} />
                                                    <span>{service.gstPercent}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${service.isActive ? 'active' : 'inactive'}`}>
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            {isOwner && (
                                                <td>
                                                    <div className="table-actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="icon-btn hover-gold" 
                                                            title="Edit Service"
                                                            onClick={() => openEditServiceModal(service)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            className="icon-btn hover-danger" 
                                                            title="Deactivate Service"
                                                            onClick={() => handleDeleteService(service.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CREATE CATEGORY MODAL --- */}
            {isCategoryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content text-left">
                        <div className="modal-header">
                            <h2>New Service Category</h2>
                            <button className="close-btn" onClick={() => setIsCategoryModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="form-group margin-bottom-md">
                                <label>Category Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Hair Coloring, Facial, Massage"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group margin-bottom-lg">
                                <label>Parent Category (Optional)</label>
                                <select
                                    className="form-control"
                                    value={categoryForm.parentId || ''}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                                >
                                    <option value="">None (Top-Level Category)</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsCategoryModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Create Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CREATE SERVICE MODAL --- */}
            {isServiceModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content service-modal-width text-left">
                        <div className="modal-header">
                            <h2>{serviceModalMode === 'CREATE' ? 'Create New Service' : 'Edit Service Details'}</h2>
                            <button className="close-btn" onClick={() => setIsServiceModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleServiceSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Service Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., Deep Tissue Massage 60m"
                                        value={serviceForm.name}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        className="form-control text-area-style"
                                        placeholder="Enter details of what this service includes..."
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        className="form-control"
                                        value={serviceForm.categoryId}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <React.Fragment key={cat.id}>
                                                <option value={cat.id}>{cat.name} (Parent)</option>
                                                {cat.subCategories && cat.subCategories.map(sub => (
                                                    <option key={sub.id} value={sub.id}>
                                                        &nbsp;&nbsp;— {sub.name}
                                                    </option>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min={5}
                                        max={480}
                                        value={serviceForm.durationMinutes}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Base Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={serviceForm.basePrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Member Price (Optional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={serviceForm.memberPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, memberPrice: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Weekend Price (Optional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={serviceForm.weekendPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, weekendPrice: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Percent (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={serviceForm.gstPercent}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsServiceModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    {serviceModalMode === 'CREATE' ? 'Create Service' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

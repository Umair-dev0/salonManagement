import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Edit, Trash2, Layers, Tag, Briefcase, 
    X, Check, AlertCircle, HelpCircle, ToggleLeft, ToggleRight, Search, ChevronDown
} from 'lucide-react';
import api from '../../api/axiosClient';

export default function ServiceCatalogTab() {
    const [subTab, setSubTab] = useState('SERVICES'); // 'SERVICES', 'CATEGORIES', 'PACKAGES'
    const [isLoading, setIsLoading] = useState(false);
    
    // Core Data States
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [packages, setPackages] = useState([]);

    // Filters for Services
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [includeInactive, setIncludeInactive] = useState(true);

    // Custom Category Dropdown States
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState({});
    const dropdownRef = useRef(null);

    // Close category dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get selected category name for the dropdown trigger
    const getSelectedCategoryName = () => {
        if (selectedCategoryFilter === 'ALL') return 'All Categories';
        const found = flatCategories.find(c => String(c.id) === String(selectedCategoryFilter));
        return found ? found.name.replace(/^[\s—\-]+/g, '') : 'All Categories';
    };

    // Toggle category expand state without selecting it
    const toggleCategoryExpand = (id, event) => {
        event.stopPropagation();
        setExpandedCategoryIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryModalMode, setCategoryModalMode] = useState('CREATE'); // 'CREATE', 'EDIT'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '' });

    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceModalMode, setServiceModalMode] = useState('CREATE'); // 'CREATE', 'EDIT'
    const [selectedService, setSelectedService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        categoryId: '',
        name: '',
        description: '',
        basePrice: '',
        memberPrice: '',
        weekendPrice: '',
        durationMinutes: '',
        gstPercent: '18.00',
        active: true
    });

    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [packageModalMode, setPackageModalMode] = useState('CREATE'); // 'CREATE', 'EDIT'
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packageForm, setPackageForm] = useState({
        name: '',
        packagePrice: '',
        gstPercent: '18.00',
        serviceIds: [],
        active: true
    });

    // === API CALLS ===

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/service-categories');
            setCategories(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/services?includeInactive=${includeInactive}`);
            setServices(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch services:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPackages = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/service-packages?includeInactive=${includeInactive}`);
            setPackages(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load data based on sub-tab
    useEffect(() => {
        if (subTab === 'SERVICES') {
            fetchCategories();
            fetchServices();
        } else if (subTab === 'CATEGORIES') {
            fetchCategories();
        } else if (subTab === 'PACKAGES') {
            fetchServices();
            fetchPackages();
        }
    }, [subTab, includeInactive]);

    // Helper function to flatten category tree for selection dropdowns
    const getFlattenedCategories = (cats, prefix = '') => {
        let list = [];
        cats.forEach(cat => {
            list.push({ id: cat.id, name: prefix + cat.name });
            if (cat.subCategories && cat.subCategories.length > 0) {
                list = [...list, ...getFlattenedCategories(cat.subCategories, prefix + '— ')];
            }
        });
        return list;
    };

    const flatCategories = getFlattenedCategories(categories);

    // ==========================================
    // CATEGORY HANDLERS & SUBMISSIONS
    // ==========================================
    const openCreateCategory = () => {
        setCategoryForm({ name: '', parentId: '' });
        setCategoryModalMode('CREATE');
        setIsCategoryModalOpen(true);
    };

    const openEditCategory = (cat) => {
        setSelectedCategory(cat);
        setCategoryForm({ 
            name: cat.name, 
            parentId: cat.parentId || '' 
        });
        setCategoryModalMode('EDIT');
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name: categoryForm.name,
                parentId: categoryForm.parentId === '' ? null : Number(categoryForm.parentId)
            };

            if (categoryModalMode === 'CREATE') {
                await api.post('/service-categories', payload);
            } else {
                await api.put(`/service-categories/${selectedCategory.id}`, payload);
            }
            setIsCategoryModalOpen(false);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || "Something went wrong!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Are you sure? Deleting this category will delete all subcategories and nested services!")) {
            try {
                await api.delete(`/service-categories/${id}`);
                fetchCategories();
            } catch (error) {
                alert("Failed to delete category.");
            }
        }
    };

    // ==========================================
    // SERVICE HANDLERS & SUBMISSIONS
    // ==========================================
    const openCreateService = () => {
        setServiceForm({
            categoryId: flatCategories[0]?.id || '',
            name: '',
            description: '',
            basePrice: '',
            memberPrice: '',
            weekendPrice: '',
            durationMinutes: '',
            gstPercent: '18.00',
            active: true
        });
        setServiceModalMode('CREATE');
        setIsServiceModalOpen(true);
    };

    const openEditService = (srv) => {
        setSelectedService(srv);
        setServiceForm({
            categoryId: srv.categoryId,
            name: srv.name,
            description: srv.description || '',
            basePrice: srv.basePrice,
            memberPrice: srv.memberPrice || '',
            weekendPrice: srv.weekendPrice || '',
            durationMinutes: srv.durationMinutes,
            gstPercent: srv.gstPercent,
            active: srv.active
        });
        setServiceModalMode('EDIT');
        setIsServiceModalOpen(true);
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...serviceForm,
                basePrice: Number(serviceForm.basePrice),
                memberPrice: serviceForm.memberPrice === '' ? null : Number(serviceForm.memberPrice),
                weekendPrice: serviceForm.weekendPrice === '' ? null : Number(serviceForm.weekendPrice),
                durationMinutes: Number(serviceForm.durationMinutes),
                gstPercent: Number(serviceForm.gstPercent),
                categoryId: Number(serviceForm.categoryId)
            };

            if (serviceModalMode === 'CREATE') {
                await api.post('/services', payload);
            } else {
                await api.put(`/services/${selectedService.id}`, payload);
            }
            setIsServiceModalOpen(false);
            fetchServices();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save service.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateService = async (id) => {
        if (window.confirm("Are you sure you want to deactivate this service? It will not show up in bookings.")) {
            try {
                await api.delete(`/services/${id}`);
                fetchServices();
            } catch (error) {
                alert("Failed to deactivate service.");
            }
        }
    };

    // ==========================================
    // PACKAGE HANDLERS & SUBMISSIONS
    // ==========================================
    const openCreatePackage = () => {
        setPackageForm({
            name: '',
            packagePrice: '',
            gstPercent: '18.00',
            serviceIds: [],
            active: true
        });
        setPackageModalMode('CREATE');
        setIsPackageModalOpen(true);
    };

    const openEditPackage = (pkg) => {
        setSelectedPackage(pkg);
        setPackageForm({
            name: pkg.name,
            packagePrice: pkg.packagePrice,
            gstPercent: pkg.gstPercent,
            serviceIds: pkg.services.map(s => s.id),
            active: pkg.active
        });
        setPackageModalMode('EDIT');
        setIsPackageModalOpen(true);
    };

    const handlePackageSubmit = async (e) => {
        e.preventDefault();
        if (packageForm.serviceIds.length === 0) {
            alert("Please select at least one service.");
            return;
        }
        setIsLoading(true);
        try {
            const payload = {
                ...packageForm,
                packagePrice: Number(packageForm.packagePrice),
                gstPercent: Number(packageForm.gstPercent)
            };

            if (packageModalMode === 'CREATE') {
                await api.post('/service-packages', payload);
            } else {
                await api.put(`/service-packages/${selectedPackage.id}`, payload);
            }
            setIsPackageModalOpen(false);
            fetchPackages();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save package.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivatePackage = async (id) => {
        if (window.confirm("Are you sure you want to deactivate this package?")) {
            try {
                await api.delete(`/service-packages/${id}`);
                fetchPackages();
            } catch (error) {
                alert("Failed to deactivate package.");
            }
        }
    };

    const handlePackageServiceCheckboxChange = (serviceId) => {
        setPackageForm(prev => {
            const isChecked = prev.serviceIds.includes(serviceId);
            const newServiceIds = isChecked
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId];
            return { ...prev, serviceIds: newServiceIds };
        });
    };

    // Recursively Render Category Tree Nodes
    const renderCategoryNode = (cat, depth) => {
        return (
            <div key={cat.id} style={{ borderLeft: '2px solid var(--outline-subtle)', paddingLeft: '16px', paddingTop: '8px', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cat.name}</span>
                        {depth > 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Subcategory)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => openEditCategory(cat)}
                            className="icon-btn"
                            title="Edit Category Name"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="icon-btn" style={{ color: '#c62828' }}
                            title="Delete Category"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {cat.subCategories && cat.subCategories.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                        {cat.subCategories.map(sub => renderCategoryNode(sub, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Recursively Render Category Dropdown Tree Nodes
    const renderDropdownCategoryNode = (cat, depth) => {
        const hasChildren = cat.subCategories && cat.subCategories.length > 0;
        const isExpanded = !!expandedCategoryIds[cat.id];
        const isSelected = String(selectedCategoryFilter) === String(cat.id);

        return (
            <div key={cat.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                    style={{ 
                        display: 'flex', alignItems: 'center', padding: '8px 16px', 
                        paddingLeft: `${depth * 20 + 12}px`, cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(197, 160, 89, 0.1)' : 'transparent',
                        color: isSelected ? 'var(--primary-gold-dark)' : 'var(--text-main)',
                        fontWeight: isSelected ? '600' : 'normal'
                    }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => toggleCategoryExpand(cat.id, e)}
                            style={{ background: 'none', border: 'none', marginRight: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <span style={{ fontSize: '10px' }}>
                                {isExpanded ? '▼' : '▶'}
                            </span>
                        </button>
                    ) : (
                        <div style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategoryFilter(cat.id);
                            setIsDropdownOpen(false);
                        }}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'inherit', fontWeight: 'inherit' }}
                    >
                        {cat.name}
                    </button>
                </div>

                {hasChildren && (
                    <div 
                        style={{
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease, opacity 0.3s ease',
                            maxHeight: isExpanded ? '500px' : '0px',
                            opacity: isExpanded ? 1 : 0
                        }}
                    >
                        {cat.subCategories.map(sub => renderDropdownCategoryNode(sub, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Filters and Search implementation
    const filteredServices = services.filter(srv => {
        const matchesCategory = selectedCategoryFilter === 'ALL' || srv.categoryId === Number(selectedCategoryFilter);
        const matchesSearch = srv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="catalog-container fade-in" style={{ padding: '0', animationDuration: '0.6s' }}>
            {/* Header Section */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div className="greeting">
                    <h1 style={{ marginBottom: '4px' }}>Service Catalogue</h1>
                    <p>Configure your salon's services, categories, and combo packages.</p>
                </div>
                
                {/* Active Inactive switch in Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Show Inactive Items</label>
                    <button 
                        onClick={() => setIncludeInactive(!includeInactive)}
                        className="icon-btn"
                        style={{ color: includeInactive ? 'var(--primary-gold-dark)' : 'var(--text-muted)', transition: 'color 0.2s' }}
                    >
                        {includeInactive ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="category-tabs" style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => setSubTab('SERVICES')}
                    className={`category-pill flex items-center gap-2 ${subTab === 'SERVICES' ? 'active' : ''}`}
                >
                    <Briefcase size={16} /> Services
                </button>
                <button
                    onClick={() => setSubTab('CATEGORIES')}
                    className={`category-pill flex items-center gap-2 ${subTab === 'CATEGORIES' ? 'active' : ''}`}
                >
                    <Layers size={16} /> Categories
                </button>
                <button
                    onClick={() => setSubTab('PACKAGES')}
                    className={`category-pill flex items-center gap-2 ${subTab === 'PACKAGES' ? 'active' : ''}`}
                >
                    <Tag size={16} /> Combo Packages
                </button>
            </div>

            {/* TAB CONTENT: SERVICES */}
            {subTab === 'SERVICES' && (
                <div className="slide-up" style={{ animationDelay: '0.1s' }}>
                    {/* Filters & Search */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                            <div className="search-container" style={{ width: '300px' }}>
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            
                            {/* Custom Collapsible Tree Dropdown */}
                            <div className="relative" ref={dropdownRef} style={{ width: '250px', position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="form-control"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer', backgroundColor: 'var(--bg-sidebar)' }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSelectedCategoryName()}</span>
                                    <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                {isDropdownOpen && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 50, width: '100%', minWidth: '240px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--rounded-default)', boxShadow: 'var(--shadow-surface)', maxHeight: '320px', overflowY: 'auto' }}>
                                        <div 
                                            onClick={() => {
                                                setSelectedCategoryFilter('ALL');
                                                setIsDropdownOpen(false);
                                            }}
                                            style={{ 
                                                padding: '12px 16px', cursor: 'pointer', fontSize: '14px',
                                                backgroundColor: selectedCategoryFilter === 'ALL' ? 'rgba(197, 160, 89, 0.1)' : 'transparent',
                                                color: selectedCategoryFilter === 'ALL' ? 'var(--primary-gold-dark)' : 'var(--text-main)',
                                                fontWeight: selectedCategoryFilter === 'ALL' ? '600' : 'normal'
                                            }}
                                        >
                                            All Categories
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                                        <div style={{ padding: '4px 0' }}>
                                            {categories.map(cat => renderDropdownCategoryNode(cat, 0))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={openCreateService}
                            className="primary-btn"
                        >
                            <Plus size={18} /> Add Service
                        </button>
                    </div>

                    {/* Services Listing */}
                    <div className="staff-table-card">
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading services...</div>
                        ) : filteredServices.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--outline-subtle)', borderRadius: 'var(--rounded-default)' }}>
                                No services found. Click "Add Service" to create one.
                            </div>
                        ) : (
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>Service Name</th>
                                        <th>Category</th>
                                        <th>Duration</th>
                                        <th>Base Price</th>
                                        <th>Member Price</th>
                                        <th>Weekend Price</th>
                                        <th>GST</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map(srv => (
                                        <tr key={srv.id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{srv.name}</div>
                                                {srv.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{srv.description}</div>}
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                                                    {srv.categoryName}
                                                </span>
                                            </td>
                                            <td>{srv.durationMinutes} mins</td>
                                            <td style={{ fontWeight: '600' }}>₹{srv.basePrice.toFixed(2)}</td>
                                            <td style={{ color: '#2e7d32', fontWeight: '500' }}>{srv.memberPrice ? `₹${srv.memberPrice.toFixed(2)}` : '—'}</td>
                                            <td style={{ color: 'var(--primary-gold-dark)', fontWeight: '500' }}>{srv.weekendPrice ? `₹${srv.weekendPrice.toFixed(2)}` : '—'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{srv.gstPercent}%</td>
                                            <td>
                                                <span className={`status-badge ${srv.active ? 'status-active' : 'status-inactive'}`}>
                                                    {srv.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => openEditService(srv)}
                                                        className="icon-btn"
                                                        title="Edit Service"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    {srv.active && (
                                                        <button 
                                                            onClick={() => handleDeactivateService(srv.id)}
                                                            className="icon-btn" style={{ color: '#c62828' }}
                                                            title="Deactivate Service"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CATEGORIES */}
            {subTab === 'CATEGORIES' && (
                <div className="slide-up" style={{ animationDelay: '0.1s', maxWidth: '800px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--text-main)', margin: 0 }}>Categories Hierarchy</h2>
                        <button 
                            onClick={openCreateCategory}
                            className="primary-btn"
                        >
                            <Plus size={18} /> Add Category
                        </button>
                    </div>

                    <div className="activity-card">
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading categories...</div>
                        ) : categories.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--outline-subtle)', borderRadius: 'var(--rounded-default)' }}>
                                No categories found. Click "Add Category" to get started.
                            </div>
                        ) : (
                            <div>
                                {categories.map(cat => renderCategoryNode(cat, 0))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PACKAGES */}
            {subTab === 'PACKAGES' && (
                <div className="slide-up" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--text-main)', margin: 0 }}>Combo & Service Packages</h2>
                        <button 
                            onClick={openCreatePackage}
                            className="primary-btn"
                        >
                            <Plus size={18} /> Add Package
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading packages...</div>
                    ) : packages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--outline-subtle)', borderRadius: 'var(--rounded-default)' }}>
                            No packages configured. Click "Add Package" to create one.
                        </div>
                    ) : (
                        <div className="service-grid">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="service-card">
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <h3 className="service-title">{pkg.name}</h3>
                                            <span className={`status-badge ${pkg.active ? 'status-active' : 'status-inactive'}`}>
                                                {pkg.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                                            <span className="service-price">₹{pkg.packagePrice.toFixed(2)}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({pkg.gstPercent}% GST extra)</span>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Services Included:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {pkg.services && pkg.services.map(s => (
                                                    <span key={s.id} style={{ fontSize: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--outline-subtle)' }}>
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button 
                                            onClick={() => openEditPackage(pkg)}
                                            className="secondary-btn" style={{ padding: '8px 16px', fontSize: '14px' }}
                                        >
                                            <Edit size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Edit
                                        </button>
                                        {pkg.active && (
                                            <button 
                                                onClick={() => handleDeactivatePackage(pkg.id)}
                                                className="danger-btn"
                                            >
                                                <Trash2 size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Deactivate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================
                1. CATEGORY CREATE/EDIT MODAL
            ========================================== */}
            {isCategoryModalOpen && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content scale-in" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{categoryModalMode === 'CREATE' ? 'Add New Category' : 'Edit Category'}</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Category Name</label>
                                    <input
                                        type="text" required
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-control"
                                        placeholder="e.g. Massages, Nail Art"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Parent Category (Optional)</label>
                                    <select
                                        value={categoryForm.parentId}
                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                                        className="form-control"
                                    >
                                        <option value="">No Parent (Top-level Category)</option>
                                        {flatCategories
                                            .filter(c => categoryModalMode === 'CREATE' || c.id !== selectedCategory?.id)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="secondary-btn">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className="primary-btn">
                                    {isLoading ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                2. SERVICE CREATE/EDIT MODAL
            ========================================== */}
            {isServiceModalOpen && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content scale-in" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{serviceModalMode === 'CREATE' ? 'Add New Service' : 'Edit Service'}</h2>
                            <button onClick={() => setIsServiceModalOpen(false)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleServiceSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Category</label>
                                    <select
                                        required
                                        value={serviceForm.categoryId}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                                        className="form-control"
                                    >
                                        {flatCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Service Name</label>
                                    <input
                                        type="text" required
                                        value={serviceForm.name}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-control"
                                        placeholder="e.g. Haircut & Blow Dry"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="form-control" style={{ minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Add service details here..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Base Price (₹)</label>
                                    <input
                                        type="number" required min="0" step="0.01"
                                        value={serviceForm.basePrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                                        className="form-control" placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Member Price (₹)</label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={serviceForm.memberPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, memberPrice: e.target.value }))}
                                        className="form-control" placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Weekend Price (₹)</label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={serviceForm.weekendPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, weekendPrice: e.target.value }))}
                                        className="form-control" placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Duration (Minutes)</label>
                                    <input
                                        type="number" required min="1"
                                        value={serviceForm.durationMinutes}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                                        className="form-control" placeholder="e.g. 30"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Percent (%)</label>
                                    <input
                                        type="number" required min="0" step="0.01"
                                        value={serviceForm.gstPercent}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        className="form-control" placeholder="18.00"
                                    />
                                </div>

                                <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                    <input
                                        type="checkbox"
                                        id="serviceActive"
                                        checked={serviceForm.active}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, active: e.target.checked }))}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-gold-dark)' }}
                                    />
                                    <label htmlFor="serviceActive" style={{ cursor: 'pointer', margin: 0 }}>Active / Visible</label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="secondary-btn">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className="primary-btn">
                                    {isLoading ? 'Saving...' : 'Save Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                3. COMBO PACKAGE CREATE/EDIT MODAL
            ========================================== */}
            {isPackageModalOpen && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content scale-in" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{packageModalMode === 'CREATE' ? 'Create Combo Package' : 'Edit Package'}</h2>
                            <button onClick={() => setIsPackageModalOpen(false)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePackageSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Package Name</label>
                                    <input
                                        type="text" required
                                        value={packageForm.name}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="form-control"
                                        placeholder="e.g. Bridal Deluxe Spa Pack"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Package Price (₹)</label>
                                    <input
                                        type="number" required min="0" step="0.01"
                                        value={packageForm.packagePrice}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, packagePrice: e.target.value }))}
                                        className="form-control" placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Percent (%)</label>
                                    <input
                                        type="number" required min="0" step="0.01"
                                        value={packageForm.gstPercent}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        className="form-control" placeholder="18.00"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Select Services in Package 
                                        <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} title="Check all individual services that are included in this bundle." />
                                    </label>
                                    
                                    <div style={{ border: '1px solid var(--outline-subtle)', borderRadius: 'var(--rounded-default)', padding: '12px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {services.length === 0 ? (
                                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No services available. Create services first.</p>
                                        ) : (
                                            services.map(srv => (
                                                <div key={srv.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`pkg-srv-${srv.id}`}
                                                        checked={packageForm.serviceIds.includes(srv.id)}
                                                        onChange={() => handlePackageServiceCheckboxChange(srv.id)}
                                                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-gold-dark)', cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor={`pkg-srv-${srv.id}`} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, fontSize: '14px', fontWeight: 'normal', color: 'var(--text-main)', textTransform: 'none', letterSpacing: 'normal' }}>
                                                        <span>{srv.name} <span style={{ color: 'var(--text-muted)' }}>({srv.categoryName})</span></span>
                                                        <span style={{ fontWeight: '600' }}>₹{srv.basePrice}</span>
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                    <input
                                        type="checkbox"
                                        id="packageActive"
                                        checked={packageForm.active}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, active: e.target.checked }))}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-gold-dark)' }}
                                    />
                                    <label htmlFor="packageActive" style={{ cursor: 'pointer', margin: 0 }}>Active / Visible</label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsPackageModalOpen(false)} className="secondary-btn">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className="primary-btn">
                                    {isLoading ? 'Saving...' : 'Save Combo Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
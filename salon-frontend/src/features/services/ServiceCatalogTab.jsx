import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Edit, Trash2, Layers, Tag, Briefcase, 
    X, Check, AlertCircle, HelpCircle, ToggleLeft, ToggleRight
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
            <div key={cat.id} className="border-l-2 border-neutral-200 pl-4 py-2 space-y-2">
                <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800">{cat.name}</span>
                        {depth > 0 && <span className="text-xs text-neutral-400 font-normal">(Subcategory)</span>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => openEditCategory(cat)}
                            className="p-1 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
                            title="Edit Category Name"
                        >
                            <Edit size={14} />
                        </button>
                        <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Category"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                {cat.subCategories && cat.subCategories.length > 0 && (
                    <div className="space-y-1 mt-1">
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
            <div key={cat.id} className="flex flex-col">
                <div 
                    className={`flex items-center hover:bg-neutral-50 transition-colors py-1.5 pr-4 text-sm ${
                        isSelected ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-neutral-700'
                    }`}
                    style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => toggleCategoryExpand(cat.id, e)}
                            className="w-5 h-5 flex items-center justify-center mr-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded transition-colors cursor-pointer shrink-0"
                        >
                            <span className="text-[10px] select-none text-neutral-500">
                                {isExpanded ? '▼' : '▶'}
                            </span>
                        </button>
                    ) : (
                        <div className="w-5 h-5 mr-1.5 shrink-0" />
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategoryFilter(cat.id);
                            setIsDropdownOpen(false);
                        }}
                        className="flex-1 text-left py-0.5 truncate cursor-pointer focus:outline-none font-normal"
                    >
                        {cat.name}
                    </button>
                </div>

                {hasChildren && (
                    <div 
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-800">Service Catalogue</h1>
                    <p className="text-sm text-neutral-500">Configure your salon's services, categories, and combo packages.</p>
                </div>
                
                {/* Active Inactive switch in Header */}
                <div className="flex items-center gap-3">
                    <label className="text-sm text-neutral-600 font-medium">Show Inactive Items</label>
                    <button 
                        onClick={() => setIncludeInactive(!includeInactive)}
                        className={`p-1 rounded-full transition-colors duration-200 ${includeInactive ? 'text-amber-500' : 'text-neutral-400'}`}
                    >
                        {includeInactive ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border border-neutral-200 rounded-lg p-1 bg-neutral-50 max-w-md">
                <button
                    onClick={() => setSubTab('SERVICES')}
                    className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                        subTab === 'SERVICES' 
                            ? 'bg-white shadow-sm text-neutral-900 font-bold border border-neutral-200/50' 
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <Briefcase size={16} /> Services
                </button>
                <button
                    onClick={() => setSubTab('CATEGORIES')}
                    className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                        subTab === 'CATEGORIES' 
                            ? 'bg-white shadow-sm text-neutral-900 font-bold border border-neutral-200/50' 
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <Layers size={16} /> Categories
                </button>
                <button
                    onClick={() => setSubTab('PACKAGES')}
                    className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                        subTab === 'PACKAGES' 
                            ? 'bg-white shadow-sm text-neutral-900 font-bold border border-neutral-200/50' 
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <Tag size={16} /> Combo Packages
                </button>
            </div>

            {/* TAB CONTENT: SERVICES */}
            {subTab === 'SERVICES' && (
                <div className="space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                        <div className="flex flex-1 gap-3">
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-80 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                            />
                            
                            {/* Custom Collapsible Tree Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex justify-between items-center gap-2 w-full md:w-64 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white text-left shadow-sm cursor-pointer"
                                >
                                    <span className="truncate">{getSelectedCategoryName()}</span>
                                    <span className={`text-neutral-500 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute mt-1 left-0 z-50 w-full min-w-[240px] md:min-w-[280px] bg-white border border-neutral-200 rounded-lg shadow-lg py-1 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div 
                                            onClick={() => {
                                                setSelectedCategoryFilter('ALL');
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-neutral-50 flex items-center transition-colors ${
                                                selectedCategoryFilter === 'ALL' 
                                                    ? 'bg-amber-50 text-amber-900 font-semibold' 
                                                    : 'text-neutral-700'
                                            }`}
                                        >
                                            All Categories
                                        </div>
                                        
                                        <div className="border-t border-neutral-100 my-1"></div>
                                        
                                        <div className="py-1">
                                            {categories.map(cat => renderDropdownCategoryNode(cat, 0))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={openCreateService}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus size={16} /> Add Service
                        </button>
                    </div>

                    {/* Services Listing */}
                    {isLoading ? (
                        <div className="text-center py-8 text-neutral-500 text-sm">Loading services...</div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-500 text-sm">
                            No services found. Click "Add Service" to create one.
                        </div>
                    ) : (
                        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                                            <th className="p-4">Service Name</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Duration</th>
                                            <th className="p-4">Base Price</th>
                                            <th className="p-4">Member Price</th>
                                            <th className="p-4">Weekend Price</th>
                                            <th className="p-4">GST</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                        {filteredServices.map(srv => (
                                            <tr key={srv.id} className="hover:bg-neutral-50/55 transition-colors">
                                                <td className="p-4 font-medium text-neutral-900">
                                                    <div>{srv.name}</div>
                                                    {srv.description && <div className="text-xs text-neutral-400 mt-0.5 font-normal">{srv.description}</div>}
                                                </td>
                                                <td className="p-4"><span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">{srv.categoryName}</span></td>
                                                <td className="p-4">{srv.durationMinutes} mins</td>
                                                <td className="p-4 font-semibold text-neutral-800">₹{srv.basePrice.toFixed(2)}</td>
                                                <td className="p-4 text-emerald-600 font-medium">{srv.memberPrice ? `₹${srv.memberPrice.toFixed(2)}` : '—'}</td>
                                                <td className="p-4 text-amber-700 font-medium">{srv.weekendPrice ? `₹${srv.weekendPrice.toFixed(2)}` : '—'}</td>
                                                <td className="p-4 text-neutral-500">{srv.gstPercent}%</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${srv.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-red-50 text-red-700 border border-red-200/50'}`}>
                                                        {srv.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => openEditService(srv)}
                                                            className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Service"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        {srv.active && (
                                                            <button 
                                                                onClick={() => handleDeactivateService(srv.id)}
                                                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Deactivate Service"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: CATEGORIES */}
            {subTab === 'CATEGORIES' && (
                <div className="space-y-4 max-w-3xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-neutral-800">Categories Hierarchy</h2>
                        <button 
                            onClick={openCreateCategory}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus size={16} /> Add Category
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-neutral-500 text-sm">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-500 text-sm">
                            No categories found. Click "Add Category" to get started.
                        </div>
                    ) : (
                        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
                            {/* Recursively render categories hierarchy */}
                            {categories.map(cat => renderCategoryNode(cat, 0))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: PACKAGES */}
            {subTab === 'PACKAGES' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-neutral-800">Combo & Service Packages</h2>
                        <button 
                            onClick={openCreatePackage}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus size={16} /> Add Package
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-neutral-500 text-sm">Loading packages...</div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-500 text-sm">
                            No packages configured. Click "Add Package" to create one.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-neutral-900 text-base">{pkg.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${pkg.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-red-50 text-red-700 border border-red-200/50'}`}>
                                                {pkg.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-neutral-800">₹{pkg.packagePrice.toFixed(2)}</span>
                                            <span className="text-xs text-neutral-400">({pkg.gstPercent}% GST extra)</span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Services Included:</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {pkg.services && pkg.services.map(s => (
                                                    <span key={s.id} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded border border-neutral-200/40">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-150 flex justify-end gap-2">
                                        <button 
                                            onClick={() => openEditPackage(pkg)}
                                            className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-100/50 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center gap-1.5"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        {pkg.active && (
                                            <button 
                                                onClick={() => handleDeactivatePackage(pkg.id)}
                                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center gap-1.5"
                                            >
                                                <Trash2 size={14} /> Deactivate
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
                <div className="catalog-modal-overlay">
                    <div className="catalog-modal-content category-modal">
                        <div className="catalog-modal-header">
                            <h3>{categoryModalMode === 'CREATE' ? 'Add New Category' : 'Edit Category'}</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="close-btn cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="catalog-modal-form">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-700">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                    placeholder="e.g. Massages, Nail Art"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-700">Parent Category (Optional)</label>
                                <select
                                    value={categoryForm.parentId}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
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

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
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
                <div className="catalog-modal-overlay">
                    <div className="catalog-modal-content">
                        <div className="catalog-modal-header">
                            <h3>{serviceModalMode === 'CREATE' ? 'Add New Service' : 'Edit Service'}</h3>
                            <button onClick={() => setIsServiceModalOpen(false)} className="close-btn cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="catalog-modal-form">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Category</label>
                                    <select
                                        required
                                        value={serviceForm.categoryId}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
                                    >
                                        {flatCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Service Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={serviceForm.name}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="e.g. Haircut & Blow Dry"
                                    />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-medium text-neutral-700">Description</label>
                                    <textarea
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm h-20 resize-none"
                                        placeholder="Add service details here..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Base Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={serviceForm.basePrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Member Price (₹) - Optional</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={serviceForm.memberPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, memberPrice: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Weekend Price (₹) - Optional</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={serviceForm.weekendPrice}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, weekendPrice: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={serviceForm.durationMinutes}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="e.g. 30"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">GST Percent (%)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={serviceForm.gstPercent}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="18.00"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="serviceActive"
                                        checked={serviceForm.active}
                                        onChange={(e) => setServiceForm(prev => ({ ...prev, active: e.target.checked }))}
                                        className="w-4 h-4 text-amber-600 focus:ring-amber-550 border-neutral-300 rounded"
                                    />
                                    <label htmlFor="serviceActive" className="text-sm font-medium text-neutral-700 cursor-pointer">Active / Visible</label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsServiceModalOpen(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
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
                <div className="catalog-modal-overlay">
                    <div className="catalog-modal-content">
                        <div className="catalog-modal-header">
                            <h3>{packageModalMode === 'CREATE' ? 'Create Combo Package' : 'Edit Package'}</h3>
                            <button onClick={() => setIsPackageModalOpen(false)} className="close-btn cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePackageSubmit} className="catalog-modal-form">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-700">Package Name</label>
                                <input
                                    type="text"
                                    required
                                    value={packageForm.name}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                    placeholder="e.g. Bridal Deluxe Spa Pack"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Package Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={packageForm.packagePrice}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, packagePrice: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">GST Percent (%)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={packageForm.gstPercent}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                                        placeholder="18.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                    Select Services in Package 
                                    <HelpCircle size={14} className="text-neutral-400" title="Check all individual services that are included in this bundle." />
                                </label>
                                
                                <div className="border border-neutral-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    {services.length === 0 ? (
                                        <p className="text-xs text-neutral-400">No services available. Create services first.</p>
                                    ) : (
                                        services.map(srv => (
                                            <div key={srv.id} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id={`pkg-srv-${srv.id}`}
                                                    checked={packageForm.serviceIds.includes(srv.id)}
                                                    onChange={() => handlePackageServiceCheckboxChange(srv.id)}
                                                    className="w-4 h-4 text-amber-600 focus:ring-amber-550 border-neutral-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor={`pkg-srv-${srv.id}`} className="text-xs text-neutral-700 select-none cursor-pointer flex justify-between w-full">
                                                    <span>{srv.name} <span className="text-neutral-400">({srv.categoryName})</span></span>
                                                    <span className="font-semibold text-neutral-600">₹{srv.basePrice}</span>
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="packageActive"
                                    checked={packageForm.active}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, active: e.target.checked }))}
                                    className="w-4 h-4 text-amber-600 focus:ring-amber-550 border-neutral-300 rounded"
                                />
                                <label htmlFor="packageActive" className="text-sm font-medium text-neutral-700 cursor-pointer">Active / Visible</label>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsPackageModalOpen(false)}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
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

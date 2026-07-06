import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Calendar, Users, Briefcase,
    Scissors, BarChart3, Settings, HelpCircle,
    Search, Bell, UserPlus, X, Edit, Trash2, LogOut
} from 'lucide-react';
import api from '../../api/axiosClient'; // Aapka setup kiya hua axios interceptor
import './Dashboard.css';
import ServiceCatalogTab from '../services/ServiceCatalogTab';
import { useAuth } from '../../context/AuthContext';

export default function OwnerDashboard() {
    const { logout } = useAuth();
    // Navigation State driven by URL path
    const location = useLocation();
    const navigate = useNavigate();

    // Map path to active tab
    const getActiveTabFromPath = (path) => {
        if (path.endsWith('/staff')) return 'STAFF';
        if (path.endsWith('/service-catalogue')) return 'SERVICES';
        if (path.endsWith('/calendar')) return 'CALENDAR';
        if (path.endsWith('/reports')) return 'REPORTS';
        if (path.endsWith('/settings')) return 'SETTINGS';
        return 'DASHBOARD';
    };

    const activeTab = getActiveTabFromPath(location.pathname);

    // Staff State
    const [staffs, setStaffs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE', 'VIEW', 'EDIT'
    const [selectedStaff, setSelectedStaff] = useState(null);

    const initialFormState = {
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'THERAPIST',
        specialization: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // === API CALLS ===

    // 1. Fetch All Staff
    const fetchStaffs = async () => {
        setIsLoading(true);
        try {
            // Assuming GET /api/users returns the list of staff
            const response = await api.get('/users');
            // Adjust according to your backend envelope (response.data.data or just response.data)
            setStaffs(response.data.data || response.data || []);
        } catch (error) {
            console.error("Failed to fetch staff:", error);
            // Agar backend ready nahi hai, toh tab tak empty array rakhte hain
        } finally {
            setIsLoading(false);
        }
    };

    // Jab tab 'STAFF' pe change ho, tabhi data fetch karein
    useEffect(() => {
        if (activeTab === 'STAFF') {
            fetchStaffs();
        }
    }, [activeTab]);

    // 2. Create or Update User
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (modalMode === 'CREATE') {
                await api.post('/users', formData);
            } else if (modalMode === 'EDIT') {
                // Email remove kar dete hain payload se kyunki wo update nahi ho sakti
                const { email, ...updateData } = formData;
                await api.put(`/users/${selectedStaff.id}`, updateData);
            }
            setIsModalOpen(false);
            fetchStaffs(); // Refresh the list
        } catch (error) {
            const responseData = error.response?.data;
            if (responseData?.errors) {
                const validationErrors = Object.entries(responseData.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('\n');
                alert(`Validation failed:\n${validationErrors}`);
            } else {
                alert(responseData?.message || "Something went wrong!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Soft Delete User
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to deactivate this staff member? History will be preserved.")) {
            try {
                await api.delete(`/users/${id}`);
                setIsModalOpen(false);
                fetchStaffs(); // Refresh list
            } catch (error) {
                alert("Failed to delete user.");
            }
        }
    };

    // === HANDLERS ===
    const openCreateModal = () => {
        setFormData(initialFormState);
        setModalMode('CREATE');
        setSelectedStaff(null);
        setIsModalOpen(true);
    };

    const openViewModal = (staff) => {
        setFormData({
            fullName: staff.fullName || '',
            email: staff.email || '',
            phone: staff.phone || '',
            password: '', // Don't show password
            role: staff.role || 'THERAPIST',
            specialization: staff.specialization || ''
        });
        setSelectedStaff(staff);
        setModalMode('VIEW');
        setIsModalOpen(true);
    };

    const enableEditMode = () => {
        setModalMode('EDIT');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="dashboard-layout">
            {/* --- SIDEBAR --- */}
            <div className="sidebar">
                <div>
                    <div className="sidebar-brand">LuxeManage</div>
                    <div className="sidebar-subtitle">Elite Salon Suite</div>
                </div>

                <div className="nav-menu">
                    <div
                        className={`nav-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard')}
                    >
                        <LayoutDashboard className="nav-icon" size={20} /> Dashboard
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'STAFF' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/staff')}
                    >
                        <Briefcase className="nav-icon" size={20} /> Staff Management
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'SERVICES' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/service-catalogue')}
                    >
                        <Scissors className="nav-icon" size={20} /> Service Catalogue
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'CALENDAR' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/calendar')}
                    >
                        <Calendar className="nav-icon" size={20} /> Calendar
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'REPORTS' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/reports')}
                    >
                        <BarChart3 className="nav-icon" size={20} /> Reports
                    </div>
                </div>

                <div className="sidebar-bottom">
                    <div
                        className={`nav-item ${activeTab === 'SETTINGS' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/settings')}
                    >
                        <Settings className="nav-icon" size={20} /> Settings
                    </div>
                    <div
                        className="nav-item text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                    >
                        <LogOut className="nav-icon text-red-500" size={20} /> Logout
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="main-content">

                {/* Top Navigation Bar */}
                <div className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={18} />
                        <input type="text" placeholder="Search..." className="search-input" />
                    </div>

                    <div className="user-profile">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#eae7e7', margin: '0 8px' }}></div>

                        <div className="profile-info">
                            {/* Added explicitly as requested */}
                            <div className="profile-name">Welcome, Boss</div>
                            <div className="profile-role" style={{ color: 'var(--primary-gold-dark)', fontWeight: 'bold' }}>OWNER</div>
                        </div>
                        <div className="profile-avatar"></div>
                    </div>
                </div>

                {/* Dynamic Body Content */}
                <div className="dashboard-body">

                    {activeTab === 'DASHBOARD' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Good Morning</h1>
                                    <p>Select "Staff Management" from the menu to manage your users.</p>
                                </div>
                            </div>
                            {/* Baki Dashboard UI jo pehle tha, waisa hi rahega yahan */}
                        </div>
                    )}

                    {activeTab === 'STAFF' && (
                        <div>
                            <div className="staff-section-header">
                                <div className="greeting">
                                    <h1>Staff Directory</h1>
                                    <p>Manage salon therapists, front desk, and managers.</p>
                                </div>
                                <button className="primary-btn" onClick={openCreateModal}>
                                    <UserPlus size={18} /> Create User
                                </button>
                            </div>

                            {isLoading ? (
                                <p>Loading staff data...</p>
                            ) : staffs.length === 0 ? (
                                <p>No staff found. Create a new user to get started.</p>
                            ) : (
                                <div className="staff-grid">
                                    {staffs.map(staff => (
                                        <div key={staff.id} className="staff-card" onClick={() => openViewModal(staff)}>
                                            <div className="staff-card-header">
                                                <strong>{staff.fullName}</strong>
                                                {/* Agar backend se aane wala 'active' ya 'is_active' explicitly false hai, tabhi INACTIVE dikhao */}
                                                <span className={`status-badge ${staff.active === false || staff.is_active === false || staff.isActive === false ? 'status-inactive' : 'status-active'}`}>
                                                    {staff.active === false || staff.is_active === false || staff.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                {staff.role}
                                            </div>
                                            <div style={{ fontSize: '12px' }}>
                                                Specialty: {staff.specialization || 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'SERVICES' && (
                        <ServiceCatalogTab />
                    )}

                    {activeTab === 'CALENDAR' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Calendar</h1>
                                    <p>View daily schedules and bookings.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Calendar Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This section is currently being integrated with salon booking engines.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'REPORTS' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Reports</h1>
                                    <p>Analyze performance, sales, and statistics.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Analytics & Reports Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sales and receptionist dashboards will populate data here shortly.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SETTINGS' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Settings</h1>
                                    <p>Configure salon profile, rules, and security.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Settings Configuration Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Salon hours, taxes, and profile customizations will be editable here.</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* --- CREATE / UPDATE / VIEW MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'CREATE' ? 'Create New User' :
                                    modalMode === 'EDIT' ? 'Update User Details' : 'Staff Details'}
                            </h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        className="form-control"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'VIEW'}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email (Cannot be changed later)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'VIEW' || modalMode === 'EDIT'}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="form-control"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'VIEW'}
                                        required
                                    />
                                </div>

                                {/* Password field only shown during creation or explicit update */}
                                {modalMode !== 'VIEW' && (
                                    <div className="form-group full-width">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-control"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder={modalMode === 'EDIT' ? "Leave blank to keep current password" : "Enter password"}
                                            required={modalMode === 'CREATE'}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Role</label>
                                    <select
                                        name="role"
                                        className="form-control"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'VIEW'}
                                    >
                                        <option value="THERAPIST">Therapist</option>
                                        <option value="FRONT_DESK">Front Desk</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="OWNER">Owner</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Specialization</label>
                                    <input
                                        type="text"
                                        name="specialization"
                                        className="form-control"
                                        value={formData.specialization}
                                        onChange={handleInputChange}
                                        disabled={modalMode === 'VIEW'}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                {modalMode === 'VIEW' ? (
                                    <>
                                        <button type="button" className="danger-btn" onClick={() => handleDelete(selectedStaff.id)}>
                                            <Trash2 size={16} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                            Deactivate
                                        </button>
                                        <button type="button" className="primary-btn" onClick={enableEditMode}>
                                            <Edit size={16} style={{ marginRight: '4px' }} />
                                            Edit Details
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="primary-btn" disabled={isLoading}>
                                            {isLoading ? 'Saving...' : 'Save User'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}
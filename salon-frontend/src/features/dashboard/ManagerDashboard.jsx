import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Briefcase, BarChart3, Settings, Bell, Search, Scissors, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ServiceCatalogTab from '../services/ServiceCatalogTab';
import './Dashboard.css'; // Wahi premium CSS reuse kar rahe hain

export default function ManagerDashboard() {
    const { user, logout } = useAuth();

    // Navigation State driven by URL path
    const location = useLocation();
    const navigate = useNavigate();

    // Map path to active tab
    const getActiveTabFromPath = (path) => {
        if (path.endsWith('/service-catalogue')) return 'SERVICES';
        if (path.endsWith('/calendar')) return 'CALENDAR';
        if (path.endsWith('/clients')) return 'CLIENTS';
        if (path.endsWith('/inventory')) return 'INVENTORY';
        if (path.endsWith('/reports')) return 'REPORTS';
        return 'DASHBOARD';
    };

    const activeTab = getActiveTabFromPath(location.pathname);

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
                        className={`nav-item ${activeTab === 'SERVICES' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/service-catalogue')}
                    >
                        <Scissors className="nav-icon" size={20} /> Service Catalogue
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'CALENDAR' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/calendar')}
                    >
                        <Calendar className="nav-icon" size={20} /> Calendar & Schedule
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'CLIENTS' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/clients')}
                    >
                        <Users className="nav-icon" size={20} /> Clients
                    </div>
                    <div 
                        className={`nav-item ${activeTab === 'INVENTORY' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/inventory')}
                    >
                        <Briefcase className="nav-icon" size={20} /> Inventory
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
                <div className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={18} />
                        <input type="text" placeholder="Search..." className="search-input" />
                    </div>
                    <div className="user-profile">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#eae7e7', margin: '0 8px' }}></div>
                        <div className="profile-info">
                            <div className="profile-name">Welcome, {user?.fullName || 'Manager'}</div>
                            <div className="profile-role" style={{ color: 'var(--primary-gold-dark)', fontWeight: 'bold' }}>MANAGER</div>
                        </div>
                        <div className="profile-avatar"></div>
                    </div>
                </div>

                <div className="dashboard-body">
                    {activeTab === 'DASHBOARD' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Welcome, {user?.fullName || 'Manager'}</h1>
                                    <p>Your branch overview and daily tasks will appear here.</p>
                                </div>
                            </div>

                            {/* Empty State for now */}
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>No recent data to display</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Once the backend modules are ready, branch statistics will populate here.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SERVICES' && (
                        <ServiceCatalogTab />
                    )}

                    {activeTab === 'CALENDAR' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Calendar & Schedule</h1>
                                    <p>View daily appointments and therapist schedules.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Calendar Module Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This section is currently being integrated with booking records.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CLIENTS' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Clients Directory</h1>
                                    <p>Manage salon clients and view customer records.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Clients Module Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Customer loyalty programs and visit history tracking will be available here.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'INVENTORY' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Inventory Management</h1>
                                    <p>Track salon supplies, products, and stock levels.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Inventory Module Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Stock alerts, supplier orders, and product usage analytics are under development.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'REPORTS' && (
                        <div>
                            <div className="page-header">
                                <div className="greeting">
                                    <h1>Reports & Analytics</h1>
                                    <p>Analytics dashboards and financial insights.</p>
                                </div>
                            </div>
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Reports Coming Soon</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monthly sales reports, service trends, and staff performance sheets will be loaded here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
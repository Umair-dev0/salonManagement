import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Receipt, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerCRMTab from '../customers/CustomerCRMTab';
import CalendarPage from '../appointments/CalendarPage';
import BillingPOSPage from '../billing/BillingPOSPage';
import './Dashboard.css';

export default function FrontDeskDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getActiveTab = (path) => {
        if (path.endsWith('/customers')) return 'CUSTOMERS';
        if (path.endsWith('/bookings')) return 'BOOKINGS';
        if (path.endsWith('/billing')) return 'BILLING';
        return 'DASHBOARD';
    };

    const activeTab = getActiveTab(location.pathname);

    return (
        <div className="dashboard-layout">
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
                        <LayoutDashboard className="nav-icon" size={20} /> Front Desk Home
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'BOOKINGS' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/bookings')}
                    >
                        <CalendarDays className="nav-icon" size={20} /> Bookings
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'CUSTOMERS' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/customers')}
                    >
                        <Users className="nav-icon" size={20} /> Customers
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'BILLING' ? 'active' : ''}`}
                        onClick={() => navigate('/dashboard/billing')}
                    >
                        <Receipt className="nav-icon" size={20} /> Billing & POS
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

            <div className="main-content">
                <div className="top-bar">
                    <div className="search-container">
                        <Search className="search-icon" size={18} />
                        <input type="text" placeholder="Search client by mobile..." className="search-input" />
                    </div>
                    <div className="user-profile">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#eae7e7', margin: '0 8px' }}></div>
                        <div className="profile-info">
                            <div className="profile-name">Welcome, {user?.fullName || 'Cashier'}</div>
                            <div className="profile-role" style={{ color: 'var(--primary-gold-dark)', fontWeight: 'bold' }}>FRONT DESK</div>
                        </div>
                        <div className="profile-avatar"></div>
                    </div>
                </div>

                <div className="dashboard-body">
                    {activeTab === 'DASHBOARD' && (
                        <CalendarPage />
                    )}

                    {activeTab === 'CUSTOMERS' && (
                        <CustomerCRMTab />
                    )}

                    {activeTab === 'BOOKINGS' && (
                        <CalendarPage />
                    )}

                    {activeTab === 'BILLING' && (
                        <BillingPOSPage />
                    )}
                </div>
            </div>
        </div>
    );
}
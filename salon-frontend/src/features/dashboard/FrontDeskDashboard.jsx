import React from 'react';
import { LayoutDashboard, CalendarDays, Users, Receipt, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

export default function FrontDeskDashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-layout">
            <div className="sidebar">
                <div>
                    <div className="sidebar-brand">LuxeManage</div>
                    <div className="sidebar-subtitle">Elite Salon Suite</div>
                </div>

                <div className="nav-menu">
                    <div className="nav-item active"><LayoutDashboard className="nav-icon" size={20} /> Front Desk Home</div>
                    <div className="nav-item"><CalendarDays className="nav-icon" size={20} /> Bookings</div>
                    <div className="nav-item"><Users className="nav-icon" size={20} /> Walk-ins & Clients</div>
                    <div className="nav-item"><Receipt className="nav-icon" size={20} /> Billing & POS</div>
                </div>

                <div className="sidebar-bottom">
                    <div className="nav-item logout-btn" onClick={logout}>
                        <LogOut className="nav-icon" size={20} /> Logout
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
                    <div className="page-header">
                        <div className="greeting">
                            <h1>Good Day, {user?.fullName || 'Cashier'}</h1>
                            <p>Manage today's appointments and billing from here.</p>
                        </div>
                    </div>

                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>Ready for Walk-ins</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>The daily booking calendar will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
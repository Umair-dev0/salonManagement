import React from 'react';
import { LayoutDashboard, Calendar, Users, Briefcase, BarChart3, Settings, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css'; // Wahi premium CSS reuse kar rahe hain

export default function ManagerDashboard() {
    const { user } = useAuth();

    return (
        <div className="dashboard-layout">
            {/* --- SIDEBAR --- */}
            <div className="sidebar">
                <div>
                    <div className="sidebar-brand">LuxeManage</div>
                    <div className="sidebar-subtitle">Elite Salon Suite</div>
                </div>

                <div className="nav-menu">
                    <div className="nav-item active"><LayoutDashboard className="nav-icon" size={20} /> Dashboard</div>
                    <div className="nav-item"><Calendar className="nav-icon" size={20} /> Calendar & Schedule</div>
                    <div className="nav-item"><Users className="nav-icon" size={20} /> Clients</div>
                    <div className="nav-item"><Briefcase className="nav-icon" size={20} /> Inventory</div>
                    <div className="nav-item"><BarChart3 className="nav-icon" size={20} /> Reports</div>
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
            </div>
        </div>
    );
}
import React from 'react';
import { CalendarCheck, Star, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

export default function TherapistDashboard() {
    const { user } = useAuth();

    return (
        <div className="dashboard-layout">
            <div className="sidebar">
                <div>
                    <div className="sidebar-brand">LuxeManage</div>
                    <div className="sidebar-subtitle">Elite Salon Suite</div>
                </div>

                <div className="nav-menu">
                    <div className="nav-item active"><CalendarCheck className="nav-icon" size={20} /> My Appointments</div>
                    <div className="nav-item"><Star className="nav-icon" size={20} /> My Performance</div>
                </div>
            </div>

            <div className="main-content">
                <div className="top-bar">
                    <div style={{ flexGrow: 1 }}></div> {/* Spacer to push profile to right */}
                    <div className="user-profile">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#eae7e7', margin: '0 8px' }}></div>
                        <div className="profile-info">
                            <div className="profile-name">Welcome, {user?.fullName || 'Stylist'}</div>
                            <div className="profile-role" style={{ color: 'var(--primary-gold-dark)', fontWeight: 'bold' }}>THERAPIST</div>
                        </div>
                        <div className="profile-avatar"></div>
                    </div>
                </div>

                <div className="dashboard-body">
                    <div className="page-header">
                        <div className="greeting">
                            <h1>Hello, {user?.fullName || 'Stylist'}</h1>
                            <p>Here is your schedule for today.</p>
                        </div>
                    </div>

                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--outline-variant)' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>No upcoming appointments</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>When the front desk assigns a client to you, it will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
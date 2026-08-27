import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Search, Filter, Plus, Clock, User, CheckCircle, AlertCircle, RefreshCw, X, TrendingUp, Scissors } from 'lucide-react';
import { getAppointments, updateAppointmentStatus } from '../../api/appointments';
import api from '../../api/axiosClient';
import BookingForm from './BookingForm';

export default function CalendarPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [stylists, setStylists] = useState([]);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStylist, setFilterStylist] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchDate, setSearchDate] = useState(''); // Date specific search

    // Modals
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    // Fetch stylists list
    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const response = await api.get('/users');
                const list = response.data.data || response.data || [];
                setStylists(list.filter(u => u.role === 'THERAPIST'));
            } catch (err) {
                console.error("Failed to load stylists:", err);
            }
        };
        fetchStylists();
    }, []);

    // Load appointments (with optional date search and stylist filtering)
    const loadAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAppointments({
                date: searchDate || null, // If empty, backend returns all appointments
                staffId: filterStylist || null
            });
            setAppointments(data || []);
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
        } finally {
            setIsLoading(false);
        }
    }, [searchDate, filterStylist]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    // Handlers
    const handleCheckIn = async (id) => {
        const appt = appointments.find(a => a.id === id);
        try {
            await updateAppointmentStatus(id, 'CHECKED_IN');
            const smsSimulation = `[SMS SIMULATION SENT to ${appt?.customerMobile}]:\n"Hi ${appt?.customerName}, you have been checked in at LuxeManage. Your stylist has been notified and will be with you shortly. Relax and enjoy our welcome drink!"`;
            alert(`Customer checked in successfully!\n\n${smsSimulation}`);
            loadAppointments();
        } catch (err) {
            alert("Failed to update status!");
        }
    };

    const handleCancel = async (id) => {
        const appt = appointments.find(a => a.id === id);
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            try {
                await updateAppointmentStatus(id, 'CANCELLED');
                const smsSimulation = `[SMS SIMULATION SENT to ${appt?.customerMobile}]:\n"Hi ${appt?.customerName}, your booking at LuxeManage for ${appt?.appointmentDate} at ${appt?.startTime?.slice(0, 5)} has been cancelled. We hope to see you again soon!"`;
                alert(`Booking cancelled successfully!\n\n${smsSimulation}`);
                loadAppointments();
            } catch (err) {
                alert("Failed to cancel booking!");
            }
        }
    };

    // Filtered list client-side
    const getFilteredAppointments = () => {
        return appointments.filter(appt => {
            // 1. Search Query filter (Customer name, customer mobile, stylist name, notes)
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                appt.customerName?.toLowerCase().includes(q) ||
                appt.customerMobile?.includes(q) ||
                appt.notes?.toLowerCase().includes(q) ||
                appt.services?.some(s => s.assignedStylistName?.toLowerCase().includes(q) || s.serviceName?.toLowerCase().includes(q));

            // 2. Status filter
            const matchesStatus = filterStatus === 'ALL' || appt.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    };

    const filteredList = getFilteredAppointments();

    // Summary counts calculations
    const scheduledCount = filteredList.filter(a => a.status === 'BOOKED' || a.status === 'CONFIRMED').length;
    const checkedInCount = filteredList.filter(a => a.status === 'CHECKED_IN').length;
    const activeCount = filteredList.filter(a => a.status === 'IN_SERVICE').length;
    const completedCount = filteredList.filter(a => a.status === 'COMPLETED' || a.status === 'BILLED').length;
    const cancelledCount = filteredList.filter(a => a.status === 'CANCELLED').length;

    const getStatusClass = (status) => {
        switch (status) {
            case 'BOOKED': return 'status-booked';
            case 'CONFIRMED': return 'status-confirmed';
            case 'CHECKED_IN': return 'status-checked-in';
            case 'IN_SERVICE': return 'status-in-service';
            case 'COMPLETED': return 'status-completed';
            case 'BILLED': return 'status-billed';
            case 'CANCELLED': return 'status-inactive';
            default: return '';
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="crm-container">
            {/* Header */}
            <div className="crm-header">
                <div className="greeting">
                    <h1>Appointments Tracker</h1>
                    <p>Unified overview, filtering & tracking of all client sessions.</p>
                </div>
                <button className="primary-btn" onClick={() => setIsBookingOpen(true)}>
                    <Plus size={18} /> Book Session
                </button>
            </div>

            {/* Summary Row */}
            <div className="crm-stats-row" style={{ marginBottom: '24px' }}>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(119,90,25,0.1)' }}>
                        <Clock size={20} color="var(--primary-gold-dark)" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{scheduledCount}</div>
                        <div className="crm-stat-label">Scheduled</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(74,124,89,0.1)' }}>
                        <CheckCircle size={20} color="#4a7c59" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{checkedInCount}</div>
                        <div className="crm-stat-label">Checked In</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(45,125,154,0.1)' }}>
                        <RefreshCw size={20} color="#2d7d9a" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{activeCount}</div>
                        <div className="crm-stat-label">In Service</div>
                    </div>
                </div>
                <div className="crm-stat-card">
                    <div className="crm-stat-icon" style={{ backgroundColor: 'rgba(197,160,89,0.1)' }}>
                        <TrendingUp size={20} color="#c5a059" />
                    </div>
                    <div>
                        <div className="crm-stat-value">{completedCount}</div>
                        <div className="crm-stat-label">Completed</div>
                    </div>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="crm-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                {/* Search Bar + Date Search */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="crm-search-wrapper" style={{ flex: 2, minWidth: '250px' }}>
                        <Search size={16} className="crm-search-icon" />
                        <input
                            type="text"
                            className="crm-search-input"
                            placeholder="Search by client, mobile, stylist, or service..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="crm-clear-search" onClick={() => setSearchQuery('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Specific Date Search (Requested) */}
                    <div className="crm-search-wrapper" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="date"
                            className="crm-search-input"
                            value={searchDate}
                            onChange={e => setSearchDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', flex: 1 }}
                        />
                        {searchDate && (
                            <button className="crm-clear-search" onClick={() => setSearchDate('')} style={{ right: '12px', position: 'relative' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Dropdowns filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Stylist Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Stylist:</span>
                            <select
                                className="form-control"
                                value={filterStylist}
                                onChange={e => setFilterStylist(e.target.value)}
                                style={{ padding: '6px 12px', minWidth: '150px' }}
                            >
                                <option value="">All Stylists</option>
                                {stylists.map(s => (
                                    <option key={s.id} value={s.id}>{s.fullName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
                            <select
                                className="form-control"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                style={{ padding: '6px 12px', minWidth: '150px' }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="BOOKED">Booked</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="CHECKED_IN">Checked In</option>
                                <option value="IN_SERVICE">In Service</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                            Found: {filteredList.length} Sessions
                        </span>
                        <button className="secondary-btn" style={{ padding: '10px' }} onClick={loadAppointments}>
                            <RefreshCw size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List Table container */}
            <div className="crm-grid-area" style={{ position: 'relative' }}>
                {isLoading ? (
                    <div className="crm-loading">
                        <div className="crm-spinner" />
                        <p>Loading schedule...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="crm-empty-state">
                        <Calendar size={48} color="var(--text-muted)" />
                        <h3>No appointments matched your query</h3>
                        <p>Try clearing your date search or stylist filters.</p>
                        <button className="primary-btn" onClick={() => { setSearchDate(''); setSearchQuery(''); setFilterStylist(''); setFilterStatus('ALL'); }}>
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredList.map(booking => (
                            <div key={booking.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', borderLeft: `5px solid var(--primary-gold)` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
                                                {booking.customerName}
                                            </span>
                                            <span style={{ fontSize: '10px', fontWeight: '600', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {booking.source === 'WALK_IN' ? 'Walk-in' : 'Booked'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                            <span>Mobile: {booking.customerMobile}</span>
                                            {booking.notes && <span style={{ color: 'var(--primary-gold-dark)', fontWeight: '500' }}>• Notes: "{booking.notes}"</span>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                                {formatDate(booking.appointmentDate)}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}
                                            </span>
                                        </div>
                                        <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Services Row */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }}>
                                    {booking.services.map(s => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Scissors size={12} color="var(--primary-gold-dark)" />
                                                <span style={{ fontWeight: '500' }}>{s.serviceName}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>stylist: {s.assignedStylistName}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600' }}>Rs {s.price}</span>
                                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: s.status === 'COMPLETED' ? 'rgba(74, 124, 89, 0.12)' : s.status === 'STARTED' ? 'rgba(45, 125, 154, 0.12)' : 'rgba(127,118,103,0.12)', color: s.status === 'COMPLETED' ? '#4a7c59' : s.status === 'STARTED' ? '#2d7d9a' : 'var(--text-muted)' }}>
                                                    {s.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    {booking.status === 'CONFIRMED' && (
                                        <>
                                            <button className="danger-btn" onClick={() => handleCancel(booking.id)} style={{ fontSize: '12px', padding: '4px 10px' }}>
                                                Cancel
                                            </button>
                                            {booking.appointmentDate === new Date().toISOString().split('T')[0] && (
                                                <button className="primary-btn" onClick={() => handleCheckIn(booking.id)} style={{ fontSize: '12px', padding: '4px 12px' }}>
                                                    Check In
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {booking.status === 'CHECKED_IN' && (
                                        <span style={{ fontSize: '12px', color: 'var(--primary-gold-dark)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                            <AlertCircle size={12} /> Stylist starting soon...
                                        </span>
                                    )}
                                    {booking.status === 'IN_SERVICE' && (
                                        <span style={{ fontSize: '12px', color: '#2d7d9a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                            <RefreshCw size={12} className="crm-spinner" /> Service ongoing
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Form modal */}
            {isBookingOpen && (
                <BookingForm
                    onClose={() => setIsBookingOpen(false)}
                    onSaveSuccess={loadAppointments}
                />
            )}
        </div>
    );
}

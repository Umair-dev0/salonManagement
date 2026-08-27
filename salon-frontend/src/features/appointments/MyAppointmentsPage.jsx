import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Check, Scissors, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { getAppointments, startServiceItem, completeServiceItem, addAddonToAppointment } from '../../api/appointments';
import { getServices } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

export default function MyAppointmentsPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]); // Therapist sees today's bookings
    
    // Catalog & addon state
    const [servicesList, setServicesList] = useState([]);
    const [selectedAddon, setSelectedAddon] = useState({}); // bookingId -> serviceId map
    const [addonLoading, setAddonLoading] = useState(false);

    // Load therapist schedule
    const loadMyAppointments = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            // Load only bookings assigned to the logged-in therapist
            const data = await getAppointments({
                date: selectedDate,
                staffId: user.id
            });
            // Sort by start time
            const sorted = (data || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
            setAppointments(sorted);
        } catch (err) {
            console.error("Failed to load my appointments:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, selectedDate]);

    // Load service catalog
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await getServices(false);
                setServicesList(data || []);
            } catch (err) {
                console.error("Failed to load services:", err);
            }
        };
        fetchServices();
        loadMyAppointments();
    }, [loadMyAppointments]);

    // Service handlers
    const handleStartService = async (serviceItemId) => {
        try {
            await startServiceItem(serviceItemId);
            loadMyAppointments();
        } catch (err) {
            alert("Failed to start service!");
        }
    };

    const handleCompleteService = async (serviceItemId) => {
        try {
            const updatedAppt = await completeServiceItem(serviceItemId);
            if (updatedAppt.status === 'COMPLETED') {
                const totalBill = updatedAppt.services.reduce((acc, curr) => acc + curr.price, 0);
                const points = Math.floor(totalBill / 100);
                const smsSimulation = `[SMS SIMULATION SENT to ${updatedAppt.customerMobile}]:\n"Hi ${updatedAppt.customerName}, thank you for choosing LuxeManage! Your session is complete. Total amount: Rs ${totalBill.toFixed(2)}. You earned ${points} loyalty points today. See you next time!"`;
                alert(`Service completed successfully! All services for this customer are now complete.\n\n${smsSimulation}`);
            } else {
                alert("Service marked as completed!");
            }
            loadMyAppointments();
        } catch (err) {
            alert("Failed to complete service!");
        }
    };

    // Add extra service (Addon) trigger
    const handleAddAddon = async (bookingId) => {
        const serviceId = selectedAddon[bookingId];
        if (!serviceId) {
            alert("Please select a service first!");
            return;
        }

        setAddonLoading(true);
        try {
            const updatedAppt = await addAddonToAppointment(bookingId, serviceId);
            alert("Add-on service item added to your schedule!");
            // Reset dropdown select
            setSelectedAddon(prev => ({ ...prev, [bookingId]: '' }));
            loadMyAppointments();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add service!");
        } finally {
            setAddonLoading(false);
        }
    };

    return (
        <div className="crm-container">
            {/* Header */}
            <div className="crm-header">
                <div className="greeting">
                    <h1>My Appointments</h1>
                    <p>Manage your assigned services, track start times & mark completions.</p>
                </div>
                <button className="secondary-btn" style={{ padding: '10px' }} onClick={loadMyAppointments}>
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {/* List */}
            <div className="crm-grid-area" style={{ position: 'relative' }}>
                {isLoading ? (
                    <div className="crm-loading">
                        <div className="crm-spinner" />
                        <p>Loading your schedule...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="crm-empty-state">
                        <Calendar size={48} color="var(--text-muted)" />
                        <h3>No appointments for today</h3>
                        <p>You don't have any clients assigned to you today.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {appointments.map(booking => {
                            // Extract only the services assigned to the logged-in therapist
                            const myServices = booking.services.filter(s => s.assignedStylistId === user.id);
                            
                            return (
                                <div key={booking.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>
                                                {booking.customerName}
                                            </span>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Source: {booking.source === 'WALK_IN' ? 'Walk-in' : 'Booked'} | Status: {booking.status}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '600', color: 'var(--primary-gold-dark)' }}>
                                            <Clock size={14} />
                                            <span>{booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}</span>
                                        </div>
                                    </div>

                                    {/* Stylist services list */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }}>
                                        {myServices.map(s => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Scissors size={14} color="var(--primary-gold-dark)" />
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.serviceName}</div>
                                                        {s.isAddon && (
                                                            <span style={{ fontSize: '10px', backgroundColor: 'rgba(197, 160, 89, 0.15)', color: 'var(--primary-gold-dark)', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
                                                                ADD-ON
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {/* Workflow trigger buttons based on state */}
                                                    {s.status === 'PENDING' && (
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => handleStartService(s.id)}
                                                            style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#2d7d9a' }}
                                                        >
                                                            <Play size={12} fill="white" /> Start Service
                                                        </button>
                                                    )}

                                                    {s.status === 'STARTED' && (
                                                        <button 
                                                            className="primary-btn" 
                                                            onClick={() => handleCompleteService(s.id)}
                                                            style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#4a7c59' }}
                                                        >
                                                            <Check size={12} /> Complete Service
                                                        </button>
                                                    )}

                                                    {s.status === 'COMPLETED' && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#4a7c59', fontWeight: '600' }}>
                                                            <Check size={14} /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add-on selection form (allows adding extra items used during session) */}
                                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', padding: '8px', border: '1px dashed var(--outline-variant)', borderRadius: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Add Extra Item:</span>
                                            <select
                                                className="form-control"
                                                value={selectedAddon[booking.id] || ''}
                                                onChange={e => setSelectedAddon({ ...selectedAddon, [booking.id]: e.target.value })}
                                                style={{ flex: 1, padding: '4px 8px', fontSize: '13px' }}
                                            >
                                                <option value="">— Select Service —</option>
                                                {servicesList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min) - Rs {s.basePrice}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="primary-btn"
                                                onClick={() => handleAddAddon(booking.id)}
                                                disabled={addonLoading}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}

                                    {booking.notes && (
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertCircle size={13} />
                                            <span>Notes: "{booking.notes}"</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

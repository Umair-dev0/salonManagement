import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Calendar, Clock, Plus, Trash2, Scissors } from 'lucide-react';
import { getServices } from '../../api/services';
import { getCustomers } from '../../api/customers';
import { createAppointment } from '../../api/appointments';
import api from '../../api/axiosClient';

export default function BookingForm({ onClose, onSaveSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [servicesList, setServicesList] = useState([]);
    const [stylistsList, setStylistsList] = useState([]);

    // Client lookup state
    const [mobileQuery, setMobileQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [isSearchingClient, setIsSearchingClient] = useState(false);
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientData, setNewClientData] = useState({
        fullName: '',
        email: '',
        gender: '',
        dateOfBirth: ''
    });

    // Form inputs state
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('10:00');
    const [source, setSource] = useState('FRONT_DESK'); // FRONT_DESK or WALK_IN
    const [notes, setNotes] = useState('');
    const [selectedServices, setSelectedServices] = useState([
        { serviceId: '', assignedStylistId: '' }
    ]);

    // Fetch catalog services and stylists list
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load services
                const servicesData = await getServices(false);
                setServicesList(servicesData || []);

                // Load staff
                const usersResponse = await api.get('/users');
                const allUsers = usersResponse.data.data || usersResponse.data || [];
                const therapists = allUsers.filter(u => u.role === 'THERAPIST' && u.active !== false);
                setStylistsList(therapists);
            } catch (err) {
                console.error("Failed to load booking form metadata:", err);
            }
        };
        loadInitialData();
    }, []);

    // Search client by mobile
    const handleMobileSearch = async () => {
        if (!mobileQuery.trim()) return;
        setIsSearchingClient(true);
        setIsNewClient(false);
        setSelectedClient(null);
        try {
            const data = await getCustomers({ q: mobileQuery });
            const results = data?.content || data || [];
            if (results && results.length > 0) {
                // Select exact mobile match or first match
                const exactMatch = results.find(c => c.mobile === mobileQuery);
                setSelectedClient(exactMatch || results[0]);
            } else {
                // Client not found, flag to create new profile
                setIsNewClient(true);
                setNewClientData({
                    fullName: '',
                    email: '',
                    gender: '',
                    dateOfBirth: ''
                });
            }
        } catch (err) {
            console.error("Failed to look up client:", err);
        } finally {
            setIsSearchingClient(false);
        }
    };

    // Service management helpers
    const addServiceRow = () => {
        setSelectedServices([...selectedServices, { serviceId: '', assignedStylistId: '' }]);
    };

    const removeServiceRow = (index) => {
        if (selectedServices.length === 1) return;
        setSelectedServices(selectedServices.filter((_, idx) => idx !== index));
    };

    const handleServiceChange = (index, field, value) => {
        const updated = selectedServices.map((item, idx) => {
            if (idx === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setSelectedServices(updated);
    };

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (!selectedClient && !isNewClient) {
            alert("Please search or specify a customer first!");
            return;
        }

        const validServices = selectedServices.filter(s => s.serviceId && s.assignedStylistId);
        if (validServices.length === 0) {
            alert("Please select at least one service and stylist!");
            return;
        }

        setIsLoading(true);

        const payload = {
            customerId: selectedClient?.id || null,
            customerMobile: mobileQuery || selectedClient?.mobile || null,
            customerFullName: isNewClient ? newClientData.fullName : null,
            customerEmail: isNewClient ? newClientData.email || null : null,
            customerGender: isNewClient ? newClientData.gender || null : null,
            customerDateOfBirth: isNewClient ? newClientData.dateOfBirth || null : null,
            appointmentDate: bookingDate,
            startTime: `${bookingTime}:00`,
            source: source,
            notes: notes,
            services: validServices
        };

        try {
            const data = await createAppointment(payload);
            const clientName = isNewClient ? newClientData.fullName : selectedClient?.fullName;
            const clientMobile = mobileQuery || selectedClient?.mobile;
            const smsSimulation = `[SMS SIMULATION SENT to ${clientMobile}]:\n"Hi ${clientName}, your booking at LuxeManage is confirmed for ${bookingDate} at ${bookingTime}. We look forward to pampering you!"`;
            
            alert(`Appointment booked successfully!\n\n${smsSimulation}`);
            onSaveSuccess();
            onClose();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors && typeof responseData.errors === 'object') {
                const validationErrors = Object.entries(responseData.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('\n');
                alert(`Booking failed:\n${validationErrors}`);
            } else {
                alert(responseData?.message || "Slot conflict or validation error!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <h2>Book New Session</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Customer Lookup (PDF Section 6.2 mobile lookup workflow) */}
                    <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--primary-gold-dark)', marginBottom: '12px' }}>
                            Customer Profile
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Search client by mobile *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={mobileQuery}
                                    onChange={e => setMobileQuery(e.target.value)}
                                    placeholder="Enter mobile e.g. 03001234567"
                                />
                            </div>
                            <button
                                type="button"
                                className="primary-btn"
                                onClick={handleMobileSearch}
                                disabled={isSearchingClient}
                                style={{ padding: '12px 20px', height: '46px' }}
                            >
                                <Search size={16} /> Lookup
                            </button>
                        </div>

                        {/* If Client Found */}
                        {selectedClient && (
                            <div style={{ padding: '12px', backgroundColor: 'rgba(74, 124, 89, 0.08)', border: '1px solid #4a7c59', borderRadius: '6px' }}>
                                <div style={{ fontWeight: '600', color: '#4a7c59', fontSize: '15px' }}>
                                    ✓ Customer Found: {selectedClient.fullName}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Mobile: {selectedClient.mobile} | Loyalty Balance: {selectedClient.loyaltyPoints || 0} pts
                                </div>
                            </div>
                        )}

                        {/* If New Client (Auto-create flow) */}
                        {isNewClient && (
                            <div style={{ padding: '16px', backgroundColor: 'rgba(197, 160, 89, 0.08)', border: '1px dashed var(--primary-gold)', borderRadius: '6px' }}>
                                <div style={{ fontWeight: '600', color: 'var(--primary-gold-dark)', fontSize: '14px', marginBottom: '8px' }}>
                                    ⚠ Client not found. Fill fields below to auto-register:
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newClientData.fullName}
                                            onChange={e => setNewClientData({ ...newClientData, fullName: e.target.value })}
                                            placeholder="e.g. Sana Malik"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={newClientData.email}
                                            onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                                            placeholder="sana@gmail.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            className="form-control"
                                            value={newClientData.gender}
                                            onChange={e => setNewClientData({ ...newClientData, gender: e.target.value })}
                                        >
                                            <option value="">— Select —</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="MALE">Male</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={newClientData.dateOfBirth}
                                            onChange={e => setNewClientData({ ...newClientData, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booking Details */}
                    <div className="form-grid" style={{ marginBottom: '20px' }}>
                        <div className="form-group">
                            <label>Appointment Date *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={bookingDate}
                                    onChange={e => setBookingDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Start Time *</label>
                            <input
                                type="time"
                                className="form-control"
                                value={bookingTime}
                                onChange={e => setBookingTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Booking Source *</label>
                            <select
                                className="form-control"
                                value={source}
                                onChange={e => setSource(e.target.value)}
                            >
                                <option value="FRONT_DESK">Front Desk Call</option>
                                <option value="WALK_IN">Walk-in Customer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Internal Notes</label>
                            <input
                                type="text"
                                className="form-control"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Special instructions..."
                            />
                        </div>
                    </div>

                    {/* Services Picker (Allows booking multiple items) */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--primary-gold-dark)', margin: 0 }}>
                                Services & Stylists
                            </h3>
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={addServiceRow}
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Plus size={14} /> Add Service
                            </button>
                        </div>

                        {selectedServices.map((row, index) => (
                            <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <select
                                        className="form-control"
                                        value={row.serviceId}
                                        onChange={e => handleServiceChange(index, 'serviceId', e.target.value)}
                                        required
                                    >
                                        <option value="">— Select Service —</option>
                                        {servicesList.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.durationMinutes} min) - Rs {s.basePrice}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <select
                                        className="form-control"
                                        value={row.assignedStylistId}
                                        onChange={e => handleServiceChange(index, 'assignedStylistId', e.target.value)}
                                        required
                                    >
                                        <option value="">— Assign Stylist —</option>
                                        {stylistsList.map(st => (
                                            <option key={st.id} value={st.id}>
                                                {st.fullName} ({st.specialization || 'General'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="danger-btn"
                                    onClick={() => removeServiceRow(index)}
                                    disabled={selectedServices.length === 1}
                                    style={{ padding: '8px', color: '#c62828' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Book Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

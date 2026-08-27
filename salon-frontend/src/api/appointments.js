import api from './axiosClient';

// ==========================================
// APPOINTMENT MANAGEMENT APIs
// ==========================================

// Get appointments by date (YYYY-MM-DD) and optional staffId
export const getAppointments = async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data.data;
};

// Create a new appointment (handles walk-in & booking, check-in checks)
export const createAppointment = async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data.data;
};

// Update status flow (BOOKED, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED)
export const updateAppointmentStatus = async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status?status=${status}`);
    return response.data.data;
};

// Stylist actions: Start specific service
export const startServiceItem = async (serviceItemId) => {
    const response = await api.patch(`/appointment-services/${serviceItemId}/start`);
    return response.data.data;
};

// Stylist actions: Complete specific service
export const completeServiceItem = async (serviceItemId) => {
    const response = await api.patch(`/appointment-services/${serviceItemId}/complete`);
    return response.data.data;
};

// Stylist actions: Add service add-on
export const addAddonToAppointment = async (appointmentId, serviceId) => {
    const response = await api.post(`/appointments/${appointmentId}/addons`, { serviceId });
    return response.data.data;
};

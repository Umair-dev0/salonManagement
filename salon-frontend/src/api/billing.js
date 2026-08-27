import api from './axiosClient';

// Generate draft invoice from completed appointment
export const createDraftInvoice = async (appointmentId) => {
    const response = await api.post(`/invoices/from-appointment/${appointmentId}`);
    return response.data.data;
};

// Retrieve a single invoice with details
export const getInvoice = async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data.data;
};

// Record split payments against draft invoice
export const recordPayments = async (invoiceId, payments) => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, payments);
    return response.data.data;
};

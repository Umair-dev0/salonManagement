import api from './axiosClient';

// ==========================================
// CUSTOMER CRM APIs
// ==========================================

// Get customers with optional paging, size, query, and includeInactive
export const getCustomers = async (params = {}) => {
    const response = await api.get('/customers', { params });
    // Returns the Page envelope from Spring boot (which contains content, totalElements, etc)
    return response.data.data;
};

// Get single customer by ID
export const getCustomerById = async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
};

// Get customer visit history + lifetime value
export const getCustomerHistory = async (id) => {
    const response = await api.get(`/customers/${id}/history`);
    return response.data.data;
};

// Create a new customer
export const createCustomer = async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data.data;
};

// Update an existing customer
export const updateCustomer = async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data.data;
};

// Soft delete a customer (returns 204 No Content, response.data will be empty)
export const deleteCustomer = async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
};

import api from './axiosClient';

// Fetch all categories (hierarchical tree)
export const getCategoriesAPI = async () => {
    const response = await api.get('/service-categories');
    return response.data;
};

// Create a new category
export const createCategoryAPI = async (categoryData) => {
    const response = await api.post('/service-categories', categoryData);
    return response.data;
};

// Fetch all services
export const getServicesAPI = async () => {
    const response = await api.get('/services');
    return response.data;
};

// Create a new service under a category
export const createServiceAPI = async (serviceData) => {
    const response = await api.post('/services', serviceData);
    return response.data;
};

// Update an existing service
export const updateServiceAPI = async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
};

// Delete/deactivate a service
export const deleteServiceAPI = async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
};

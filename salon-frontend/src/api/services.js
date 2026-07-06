import api from './axiosClient';

// ==========================================
// 1. SERVICE CATEGORY APIs
// ==========================================

// Get all categories in a tree structure
export const getCategoryTree = async () => {
    const response = await api.get('/service-categories');
    return response.data.data;
};

// Create a new category
export const createCategory = async (categoryData) => {
    const response = await api.post('/service-categories', categoryData);
    return response.data.data;
};

// Update an existing category
export const updateCategory = async (id, categoryData) => {
    const response = await api.put(`/service-categories/${id}`, categoryData);
    return response.data.data;
};

// Delete a category
export const deleteCategory = async (id) => {
    const response = await api.delete(`/service-categories/${id}`);
    return response.data;
};

// ==========================================
// 2. INDIVIDUAL SERVICE APIs
// ==========================================

// Get services (can include inactive ones for catalog management)
export const getServices = async (includeInactive = false) => {
    const response = await api.get(`/services?includeInactive=${includeInactive}`);
    return response.data.data;
};

// Create a new service
export const createService = async (serviceData) => {
    const response = await api.post('/services', serviceData);
    return response.data.data;
};

// Update an existing service
export const updateService = async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data.data;
};

// Soft delete/deactivate a service
export const deactivateService = async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
};

// ==========================================
// 3. COMBO PACKAGE APIs
// ==========================================

// Get packages (can include inactive ones)
export const getPackages = async (includeInactive = false) => {
    const response = await api.get(`/service-packages?includeInactive=${includeInactive}`);
    return response.data.data;
};

// Create a new combo package
export const createPackage = async (packageData) => {
    const response = await api.post('/service-packages', packageData);
    return response.data.data;
};

// Update an existing package
export const updatePackage = async (id, packageData) => {
    const response = await api.put(`/service-packages/${id}`, packageData);
    return response.data.data;
};

// Deactivate a combo package
export const deactivatePackage = async (id) => {
    const response = await api.delete(`/service-packages/${id}`);
    return response.data;
};

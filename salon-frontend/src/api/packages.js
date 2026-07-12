import api from './axiosClient';

// Get active or all packages
export const getPackagesAPI = async (showAll = false) => {
    const response = await api.get(`/packages?all=${showAll}`);
    return response.data;
};

// Create a new package
export const createPackageAPI = async (packageData) => {
    const response = await api.post('/packages', packageData);
    return response.data;
};

// Update an existing package
export const updatePackageAPI = async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data;
};

// Delete/Deactivate a package
export const deletePackageAPI = async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
};

// Restore/Reactivate a package
export const restorePackageAPI = async (id) => {
    const response = await api.patch(`/packages/${id}/restore`);
    return response.data;
};

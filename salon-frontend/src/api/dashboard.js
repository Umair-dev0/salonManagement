import api from './axiosClient';

// Get Executive Dashboard aggregated statistics (OWNER & MANAGER)
export const getDashboardStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
};

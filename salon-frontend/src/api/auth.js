import api from './axiosClient';

export const loginAPI = async (credentials) => {
    // Backend ke /api/auth/login endpoint par POST request bhejega [cite: 514]
    const response = await api.post('/auth/login', credentials);
    return response.data;
};
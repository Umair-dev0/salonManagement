import axios from 'axios';

// Vite proxy use kar rahe hain toh baseURL sirf '/api' rahega [cite: 465]
const api = axios.create({ baseURL: '/api' });

// Har request se pehle localStorage se token utha kar header me dalega [cite: 466, 467, 468]
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://back-academy.onrender.com/api',
});

// Automatically attach the token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;



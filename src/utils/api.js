import axios from "axios";

// 👇 સુધારો: પાછળ /api લગાવવું ફરજિયાત છે
const BASE_URL = "https://smart-store-backend.onrender.com/api"; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem("smartstore_user");
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("smartstore_user");
            window.location.href = "/"; 
        }
        return Promise.reject(error);
    }
);

export default api;
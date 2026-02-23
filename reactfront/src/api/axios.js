import axios from "axios";

 
const api = axios.create({
  baseURL: `http://localhost:8088/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Automatski kači Bearer token ako postoji
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ako token istekne / nije validan
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
    
    }
    return Promise.reject(err);
  }
);

export default api;

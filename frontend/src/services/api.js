import axios from "axios";


const api = axios.create({
  baseURL: "https://localhost:8081/api", // donde esta mi url del backend desplegar primero aqui luego el frontend
  });
  API.interceptors.request.use((config) => {
  const token = window.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;

});

export default api;
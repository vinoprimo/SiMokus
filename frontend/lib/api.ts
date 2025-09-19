import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api", // ganti sesuai backend kamu
});

// Interceptor untuk pasang token otomatis
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default API;

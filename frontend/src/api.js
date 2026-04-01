import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

const PUBLIC_ENDPOINTS = [
  "accounts/login",
  "accounts/register",
  "accounts/google-login",
  "accounts/phone-otp",
  "accounts/token/refresh",
];

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const requestPath = config.url || "";
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => requestPath.startsWith(endpoint));

  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

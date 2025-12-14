// src/api.js
import axios from "axios";

function resolveBaseURL() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim();

  // Fallback only for local dev
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }

  // Last resort: warn so it's obvious in prod if env is missing
  console.warn(
    "[api] VITE_API_URL is missing. Set it in your frontend Render service Environment."
  );
  return "/"; // prevents axios from throwing on undefined baseURL
}

const baseURL = resolveBaseURL();
console.log("API baseURL ->", baseURL); // keep while debugging

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bl_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
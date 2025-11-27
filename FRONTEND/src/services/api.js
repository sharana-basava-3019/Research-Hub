/**
 * API Service
 * Axios instance with base configuration
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const token = localStorage.getItem('token');
      if (token) {
        // Only redirect if user had a token (was trying to be authenticated)
        localStorage.removeItem('token');
        // Don't redirect, just clear the token
        // The app will handle showing appropriate UI based on auth state
      }
    }
    return Promise.reject(error);
  }
);

export default api;

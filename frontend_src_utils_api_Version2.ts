import axios from 'axios';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors but don't handle globally - let components handle errors
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
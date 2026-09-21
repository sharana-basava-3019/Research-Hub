import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user on mount
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  // Load current user
  const loadUser = async () => {
    try {
      if (token) {
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user data
        const res = await api.get('/auth/me');
        setUser(res.data.data.user);

        // Initialize real-time Socket.io connection
        initSocket(token);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setToken(null);
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { token: newToken, user: newUser } = res.data.data;
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user
      setUser(newUser);

      // Connect socket
      initSocket(newToken);
      
      toast.success('Registration successful! Welcome to RESEARCH-HUB.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data.data;
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user
      setUser(newUser);

      // Connect socket
      initSocket(newToken);
      
      toast.success(`Welcome back, ${newUser.firstName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    // Disconnect real-time socket
    disconnectSocket();

    // Remove token
    localStorage.removeItem('token');
    setToken(null);
    
    // Remove token from headers
    delete api.defaults.headers.common['Authorization'];
    
    // Clear user
    setUser(null);
    
    toast.info('You have been logged out.');
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/auth/updateprofile', formData);
      setUser(res.data.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/updatepassword', { currentPassword, newPassword });
      toast.success('Password updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
    isAdmin,
    isAuthenticated,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

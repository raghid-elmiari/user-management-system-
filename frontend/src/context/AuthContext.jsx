import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configureAxiosAuth } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };

  const getRefreshToken = () => {
    return localStorage.getItem('refreshToken');
  };

  useEffect(() => {
    configureAxiosAuth({
      getToken: getAccessToken,
      getRefreshToken: getRefreshToken,
      onFailure: () => {
        logout();
      }
    });
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = (authData) => {
    setAuthState(authData);
    if (authData?.accessToken) {
      localStorage.setItem('accessToken', authData.accessToken);
    }
    if (authData?.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthState(null);
    navigate('/login');
  };

  const value = {
    auth,
    setAuth,
    logout,
    isAuthenticated: !!auth,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
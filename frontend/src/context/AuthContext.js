import React, { createContext, useState, useEffect, useCallback } from 'react';
import { userAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh user data from API to avoid stale balances/scores
  const refreshUser = useCallback(async (userId) => {
    const targetId = userId || (user ? user.id : null);
    if (!targetId) return null;

    try {
      const response = await userAPI.getUserById(targetId);
      const freshUser = response.data?.user || response.data;
      if (freshUser && freshUser.id) {
        setUser(freshUser);
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(freshUser));
        return freshUser;
      }
    } catch (error) {
      console.warn('⚠️ Could not refresh user profile from server:', error.message);
    }
    return null;
  }, [user]);

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    console.log('Auth check on mount:', { savedToken, savedUser });

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsed);
        console.log('User auto-logged in, revalidating profile with server...');

        // Revalidate against the server to get fresh balances and completed tasks
        if (parsed.id) {
          userAPI.getUserById(parsed.id)
            .then(res => {
              const freshUser = res.data?.user || res.data;
              if (freshUser && freshUser.id) {
                setUser(freshUser);
                const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
                storage.setItem('user', JSON.stringify(freshUser));
                console.log('✅ User profile refreshed from server');
              }
            })
            .catch(err => {
              console.warn('⚠️ Revalidation failed, using cached user data:', err.message);
            });
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Login function
  const login = (userData, authToken, rememberMe = true) => {
    console.log('Logging in user:', userData);
    
    // Save to state
    setUser(userData);
    setToken(authToken);

    const storage = rememberMe ? localStorage : sessionStorage;
    // Clear opposite storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Save to persistence
    storage.setItem('token', authToken);
    storage.setItem('user', JSON.stringify(userData));
    
    console.log('Login successful, saving to storage');
  };

  // Update user function (updates state + persistence)
  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const newUserData = { ...prevUser, ...updatedData };
      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(newUserData));
      } else {
        sessionStorage.setItem('user', JSON.stringify(newUserData));
      }
      return newUserData;
    });
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, clearing storage');
    
    // Clear from state
    setUser(null);
    setToken(null);
    
    // Clear from storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

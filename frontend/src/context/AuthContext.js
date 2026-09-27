import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    console.log('Auth check on mount:', { savedToken, savedUser });

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        console.log('User auto-logged in');
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    setLoading(false); // IMPORTANT: Must set loading to false
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
    console.log('Token:', authToken);
    console.log('User:', userData);
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
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
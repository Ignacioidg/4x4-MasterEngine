import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('4me_token'));
  const [user, setUser] = useState<User | null>(() => {
    const username = localStorage.getItem('4me_username');
    const role = localStorage.getItem('4me_role');
    if (username && role) {
      return { Username: username, Role: role };
    }
    return null;
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiCall<{ Token: string; Username: string; Role: string }>(
      '/auth/login',
      'POST',
      { username, password }
    );

    localStorage.setItem('4me_token', data.Token);
    localStorage.setItem('4me_username', data.Username);
    localStorage.setItem('4me_role', data.Role);

    setToken(data.Token);
    setUser({ Username: data.Username, Role: data.Role, Token: data.Token });
  };

  const register = async (username: string, password: string, role: string) => {
    const data = await apiCall<{ Token: string; Username: string; Role: string }>(
      '/auth/register',
      'POST',
      { username, password, role }
    );

    localStorage.setItem('4me_token', data.Token);
    localStorage.setItem('4me_username', data.Username);
    localStorage.setItem('4me_role', data.Role);

    setToken(data.Token);
    setUser({ Username: data.Username, Role: data.Role, Token: data.Token });
  };

  const logout = () => {
    localStorage.removeItem('4me_token');
    localStorage.removeItem('4me_username');
    localStorage.removeItem('4me_role');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

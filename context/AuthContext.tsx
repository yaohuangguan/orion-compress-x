import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { loginUser, logoutUser, registerUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const storedToken = localStorage.getItem('orion_token');
    const storedUser = localStorage.getItem('orion_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const saveSession = (authData: AuthResponse) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem('orion_token', authData.token);
    localStorage.setItem('orion_user', JSON.stringify(authData.user));
    setShowAuthModal(false);
  };

  const login = async (data: any) => {
    const response = await loginUser(data);
    saveSession(response);
  };

  const register = async (data: any) => {
    const response = await registerUser(data);
    saveSession(response);
  };

  const logout = async () => {
    if (token) {
        // Fire and forget logout to backend
        logoutUser(token); 
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('orion_token');
    localStorage.removeItem('orion_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      register, 
      logout,
      showAuthModal,
      setShowAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

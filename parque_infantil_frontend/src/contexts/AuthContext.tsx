import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AuthContextType {
  user: { username: string, role: string } | null;
  configuracao: { nome_empresa: string, cnpj: string } | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
  carregarConfiguracao: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ username: string, role: string } | null>(null);
  const [configuracao, setConfig] = useState<{ nome_empresa: string, cnpj: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const uName = localStorage.getItem('username');
    const uRole = localStorage.getItem('role');
    
    if (token && uName && uRole) {
      setUser({ username: uName, role: uRole });
    }
    
    carregarConfiguracao().finally(() => setLoading(false));
  }, []);

  const carregarConfiguracao = async () => {
    try {
      const response = await api.get('/configuracoes');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (e) {
      console.error("Erro ao carregar configurações", e);
    }
  };

  const login = (token: string, username: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    setUser({ username, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, configuracao, login, logout, carregarConfiguracao }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

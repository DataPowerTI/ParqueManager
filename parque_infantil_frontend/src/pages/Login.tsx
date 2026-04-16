import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/token', formData);
      const token = response.data.access_token;
      
      // Decodifica o payload base64 do JWT para extrair a role (não é super seguro pra dados sigilosos no front, mas serve pra UI condicional)
      const payload = JSON.parse(atob(token.split('.')[1]));
      login(token, payload.sub, payload.role);
      
      navigate('/');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
        <div className="p-8 text-center bg-indigo-600">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
            <Play size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-white">Parque Manager</h1>
          <p className="text-indigo-200 mt-1">Acesso Restrito</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Usuário</label>
            <input 
              type="text" required 
              className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="ex: admin" 
              value={username} onChange={e => setUsername(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
            <input 
              type="password" required 
              className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••" 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-70 mt-4"
          >
            <LockKeyhole size={20} />
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

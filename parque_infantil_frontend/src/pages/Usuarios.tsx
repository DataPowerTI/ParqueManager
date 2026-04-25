import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [novoUsername, setNovoUsername] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoRole, setNovoRole] = useState('usuario');

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', { username: novoUsername, password: novaSenha, role: novoRole });
      setShowModal(false);
      setNovoUsername('');
      setNovaSenha('');
      setNovoRole('usuario');
      carregarUsuarios();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Erro ao criar usuário");
    }
  };

  const removerUsuario = async (id: number) => {
    if (!window.confirm("Deseja realmente remover este usuário?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregarUsuarios();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Erro ao remover usuário");
    }
  };

  if (user?.role !== 'adm') {
    return <div className="p-10 text-center text-red-600 font-bold">Acesso Negado. Apenas administradores.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border transition-all hover:-translate-x-1">
          <ArrowLeft size={18} /> Voltar para o Início
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Gestão de Usuários</h1>
            <p className="text-slate-500 font-medium">Cadastre administradores e operadores do sistema</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus size={20} className="stroke-[3]" /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="p-4 font-bold text-slate-600">ID</th>
              <th className="p-4 font-bold text-slate-600">Usuário</th>
              <th className="p-4 font-bold text-slate-600">Permissão</th>
              <th className="p-4 font-bold text-slate-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500 font-medium">#{u.id}</td>
                <td className="p-4 font-bold text-slate-800">{u.username}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    u.role === 'adm' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role === 'adm' ? 'Administrador' : 'Operador'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {u.username !== user?.username && (
                    <button 
                      onClick={() => removerUsuario(u.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <div className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><Users size={20} /></div>
                Cadastrar Usuário
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={criarUsuario} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome de Usuário (Login)</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Ex: operador2" 
                  value={novoUsername} onChange={e => setNovoUsername(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
                <input 
                  type="password" required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="********" 
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nível de Acesso</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  value={novoRole} onChange={e => setNovoRole(e.target.value)}
                >
                  <option value="usuario">Operador (Acesso restrito)</option>
                  <option value="adm">Administrador (Acesso total)</option>
                </select>
              </div>
              
              <div className="pt-2 mt-4">
                <button type="submit" className="w-full py-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/30"> 
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

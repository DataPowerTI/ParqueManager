import React, { useState, useEffect } from 'react';
import { Save, Settings, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Configuracoes() {
  const { configuracao, carregarConfiguracao, user } = useAuth();
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (configuracao) {
      setNomeEmpresa(configuracao.nome_empresa);
      setCnpj(configuracao.cnpj || '');
    }
  }, [configuracao]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.put('/configuracoes', { nome_empresa: nomeEmpresa, cnpj });
      await carregarConfiguracao();
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar as configurações.');
    } finally {
      setSalvando(false);
    }
  };

  if (user?.role !== 'adm') {
    return <div className="p-10 text-center text-red-600 font-bold">Acesso Negado. Apenas administradores.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Configurações Gerais</h1>
          <p className="text-slate-500 font-medium">Configure os dados de emissão e nome da empresa</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border p-8">
        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-bold text-sm mb-6 inline-flex">
          <ShieldCheck size={18} />
          Nível de Acesso: Administrador
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nome Fantasia da Empresa</label>
            <input 
              type="text" required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="Ex: Parque Mágico Kids" 
              value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ do Proprietário</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="00.000.000/0000-00" 
              value={cnpj} onChange={e => setCnpj(e.target.value)} 
            />
          </div>

          <button 
            type="submit" disabled={salvando}
            className="w-full py-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save size={20} />
            {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </div>
    </div>
  );
}

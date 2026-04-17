import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Settings, ShieldCheck, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Configuracoes() {
  const { configuracao, carregarConfiguracao, user } = useAuth();
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [precos, setPrecos] = useState<any[]>([]);
  const [novoTempo, setNovoTempo] = useState('');
  const [novoValor, setNovoValor] = useState('');

  const carregarPrecos = async () => {
    try {
      const res = await api.get('/precos');
      setPrecos(res.data);
    } catch(e) {}
  };

  useEffect(() => {
    if (configuracao) {
      setNomeEmpresa(configuracao.nome_empresa);
      setCnpj(configuracao.cnpj || '');
    }
    carregarPrecos();
  }, [configuracao]);

  const adicionarPreco = async () => {
    if (!novoTempo || !novoValor) return;
    const valorTratado = parseFloat(novoValor.replace(',', '.'));
    if (isNaN(valorTratado)) return alert("Digite um valor numérico válido (ex: 15,00)");
    
    try {
      await api.post('/precos', { minutos: parseInt(novoTempo), valor: valorTratado, ativo: 1 });
      setNovoTempo('');
      setNovoValor('');
      carregarPrecos();
    } catch (e) { alert("Erro ao adicionar"); }
  }

  const removerPreco = async (id: number) => {
    try {
      await api.delete(`/precos/${id}`);
      carregarPrecos();
    } catch (e) { alert("Erro ao remover"); }
  }

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
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border transition-all hover:-translate-x-1">
          <ArrowLeft size={18} /> Voltar para o Início
        </Link>
      </div>

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

      <div className="bg-white rounded-3xl shadow-sm border p-8 mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Tabela de Horários e Preços</h2>
        
        <div className="flex gap-4 mb-6">
          <input 
            type="number" placeholder="Minutos (ex: 30)" 
            value={novoTempo} onChange={e => setNovoTempo(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
          <input 
            type="text" placeholder="Valor (R$ ex: 15,00)" 
            value={novoValor} onChange={e => setNovoValor(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
          <button 
            type="button" onClick={adicionarPreco}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {precos.map(p => (
             <div key={p.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border">
               <div className="font-bold text-slate-700">{p.minutos} Minutos</div>
               <div className="flex items-center gap-4">
                 <span className="font-black text-indigo-600">R$ {p.valor.toFixed(2)}</span>
                 <button onClick={() => removerPreco(p.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">X</button>
               </div>
             </div>
          ))}
          {precos.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum preço cadastrado.</p>}
        </div>
      </div>
    </div>
  );
}

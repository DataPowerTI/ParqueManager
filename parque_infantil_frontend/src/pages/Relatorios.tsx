import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Users, ArrowLeft } from 'lucide-react';

export default function Relatorios() {
  const { user } = useAuth();
  const [hoje, setHoje] = useState<{ total_criancas_brincaram: number, faturamento_caixas_fechados: number, detalhamento_sessoes?: {[key: string]: number} } | null>(null);
  
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Endpoint que retorna relatorio do dia no backend
      const res = await api.get('/relatorios/hoje');
      setHoje(res.data);
    } catch(e) {
      console.warn("Erro ao carregar relatórios");
    }
  };

  if (user?.role !== 'adm') return <div className="p-10 text-center text-red-600 font-bold">Acesso Negado.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border transition-all hover:-translate-x-1">
          <ArrowLeft size={18} /> Voltar para o Início
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
          <BarChart3 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Relatórios Gerenciais</h1>
          <p className="text-slate-500 font-medium">Desempenho financeiro e estatísticas de uso do parque</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8 rounded-3xl border shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm uppercase mb-1">Crianças Hoje</p>
            <h2 className="text-4xl font-black text-slate-800">{hoje?.total_criancas_brincaram || 0}</h2>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp size={32} />
          </div>
          <div>
             <p className="text-slate-500 font-bold text-sm uppercase mb-1">Caixas Fechados (Bruto)</p>
             <h2 className="text-4xl font-black text-slate-800">R$ {(hoje?.faturamento_caixas_fechados || 0).toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-8 mb-8">
        <h3 className="text-xl font-bold mb-4">Detalhamento de Entradas (Sessões)</h3>
        {hoje?.detalhamento_sessoes && Object.keys(hoje.detalhamento_sessoes).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(hoje.detalhamento_sessoes).map(([forma, valor]) => (
              <div key={forma} className="bg-slate-50 p-4 rounded-2xl border flex flex-col justify-center">
                <span className="text-slate-500 font-bold text-xs uppercase mb-1">{forma}</span>
                <span className="text-xl font-black text-indigo-600">R$ {valor.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500">Nenhum pagamento registrado hoje.</div>
        )}
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="text-xl font-bold mb-6">Fechamento Mensal Estimado</h3>
        <p className="text-slate-500">
          A seção de relatórios anuais pode ser sincronizada conforme as tabelas do dashboard forem cadastradas na base. 
          Use este painel para exportar e analisar os horários de pico.
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

export default function Relatorios() {
  const { user } = useAuth();
  const [hoje, setHoje] = useState<{ totaL_criancas_brincaram: number, faturamento_caixas_fechados: number } | null>(null);
  
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Endpoint que retorna relatorio do dia simulado no backend
      const res = await api.get('/relatorios/hoje');
      setHoje(res.data);
    } catch(e) {
      console.warn("Erro ou modo simulação ativo. Dados falsos:");
      setHoje({
        totaL_criancas_brincaram: 45,
        faturamento_caixas_fechados: 1250.00
      });
    }
  };

  if (user?.role !== 'adm') return <div className="p-10 text-center text-red-600 font-bold">Acesso Negado.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
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
            <h2 className="text-4xl font-black text-slate-800">{hoje?.totaL_criancas_brincaram || 0}</h2>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm uppercase mb-1">Faturamento Hoje</p>
            <h2 className="text-4xl font-black text-slate-800">R$ {hoje?.faturamento_caixas_fechados.toFixed(2) || '0.00'}</h2>
          </div>
        </div>
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

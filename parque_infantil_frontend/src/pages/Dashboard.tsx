import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, Wallet, Clock, User, X, CheckCircle2, LogOut, Settings, BarChart3, Grip, ArrowRight, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface TabelaPreco {
  id: number;
  minutos: number;
  valor: number;
}

interface Sessao {
  id: number;
  cliente_id: number;
  horario_inicio: string;
  tempo_contratado: number;
  status: string;
  cliente?: any; // To hold joined data if any, or we fetch clients to map names
}

interface Cliente {
  id: number;
  nome_crianca: string;
  nome_responsavel: string;
}

const parseTime = (milliseconds: number) => {
  const isNegative = milliseconds < 0;
  const absMs = Math.abs(milliseconds);
  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const useSessionTimer = (startTimeRaw: string, tempoContratado: number) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [colorClass, setColorClass] = useState("bg-blue-500 text-white border-blue-600");

  useEffect(() => {
    // A string UTC vinda do FastAPI ex: "2023-11-20T14:30:00Z"
    const startTime = new Date(startTimeRaw + "Z").getTime();
    const totalDurationMs = tempoContratado * 60 * 1000;
    const endTime = startTime + totalDurationMs;

    const updateTimer = () => {
      const now = Date.now();
      const difference = endTime - now;
      setTimeLeft(difference);

      const percentage = (difference / totalDurationMs) * 100;

      if (percentage <= 0) {
        setColorClass("bg-red-600 border-red-700 text-white animate-pulse shadow-red-600/50");
      } else if (percentage <= 25) {
        setColorClass("bg-orange-500 border-orange-600 text-white shadow-orange-500/30");
      } else if (percentage <= 50) {
        setColorClass("bg-yellow-400 border-yellow-500 text-yellow-900 shadow-yellow-500/30");
      } else {
        setColorClass("bg-blue-500 border-blue-600 text-white shadow-blue-500/30");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTimeRaw, tempoContratado]);

  return { timeLeft, colorClass };
};

const SessionCard = ({ sessao, cliente, onCheckOut }: { sessao: Sessao; cliente: Cliente; onCheckOut: (s: Sessao, c: Cliente) => void }) => {
  const { timeLeft, colorClass: bgClass } = useSessionTimer(sessao.horario_inicio, sessao.tempo_contratado);
  const isLightText = !bgClass.includes('text-yellow-900');
  
  return (
    <div className={`rounded-2xl shadow-xl border p-5 flex flex-col justify-between transition-colors duration-300 ${bgClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-xl flex items-center gap-2">
            <User size={20} className={isLightText ? "text-white/80" : "text-yellow-700"} />
            {cliente?.nome_crianca || 'Carregando...'}
          </h3>
          <p className={`text-sm mt-1 font-medium flex items-center gap-2 ${isLightText ? "text-white/80" : "text-yellow-800"}`}>
            Resp: {cliente?.nome_responsavel || ''}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-black tracking-tighter flex items-center gap-1">
             <Clock size={20} className="opacity-80" />
             {parseTime(timeLeft)}
          </div>
          <span className={`text-xs opacity-90 uppercase font-bold tracking-wider block mt-1`}>
            {timeLeft <= 0 ? "Esgotado!" : "Restante"}
          </span>
        </div>
      </div>
      <div className={`mt-6 pt-4 border-t flex justify-end ${isLightText ? 'border-white/20' : 'border-yellow-900/20'}`}>
        <button 
          onClick={() => onCheckOut(sessao, cliente)}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95 ${
            isLightText ? "bg-white text-slate-800 hover:bg-slate-50" : "bg-yellow-900 text-yellow-50 hover:bg-yellow-800"
          }`}
        >
          <Square size={18} fill="currentColor" />
          Finalizar Sessão
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, configuracao, logout } = useAuth();
  const navigate = useNavigate();

  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaId, setCaixaId] = useState<number | null>(null);
  
  const [showModalIn, setShowModalIn] = useState(false);
  const [showModalOut, setShowModalOut] = useState<{sessao: Sessao, cliente: Cliente} | null>(null);

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [precos, setPrecos] = useState<TabelaPreco[]>([]);

  // Check-in Form
  const [nomeCrianca, setNomeCrianca] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [tempoSelecionado, setTempoSelecionado] = useState<TabelaPreco | null>(null);

  // Check-out Form
  const [valorCobrado, setValorCobrado] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState('PIX');

  const carregarDados = async () => {
    try {
      const [resSessoes, resClientes, resPrecos, resCaixa] = await Promise.all([
        api.get('/sessoes/'),
        api.get('/clientes/'),
        api.get('/precos'),
        api.get('/caixa/status')
      ]);
      setSessoes(resSessoes.data);
      setClientes(resClientes.data);
      
      const pr = resPrecos.data;
      setPrecos(pr);
      if (pr.length > 0) setTempoSelecionado(pr[0]);
      
      if (resCaixa.data) {
        setCaixaAberto(true);
        setCaixaId(resCaixa.data.id);
      } else {
        setCaixaAberto(false);
        setCaixaId(null);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 15000); // Poll API a cada 15s para sincronizar caixas em multinode
    return () => clearInterval(interval);
  }, []);

  const toggleCaixa = async () => {
    try {
      if (caixaAberto) {
        const valorF = parseFloat(prompt("Informe o valor físico final em CAIXA para fechar o turno:") || "0");
        await api.post(`/caixa/fechar/${caixaId}?valor_final=${valorF}`);
      } else {
        const valorI = parseFloat(prompt("Informe o Fundo de Troco inicial (R$):") || "0");
        await api.post('/caixa/abrir', { valor_inicial: valorI });
      }
      carregarDados();
    } catch (e) {
      alert("Erro ao alternar caixa. Verifique permissões.");
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto) {
      alert("⚠️ Você precisa alterar o painel para CAIXA ABERTO no topo direito.");
      return;
    }
    if (!tempoSelecionado) {
      alert("Selecione um tempo."); return;
    }
    try {
      // Cria cliente
      const resC = await api.post('/clientes/', { 
        nome_crianca: nomeCrianca, 
        nome_responsavel: nomeResponsavel, 
        contato_responsavel: contatoResponsavel 
      });
      // Cria Sessão
      await api.post('/sessoes/iniciar', {
        cliente_id: resC.data.id,
        tempo_contratado: tempoSelecionado.minutos
      });
      
      setShowModalIn(false);
      setNomeCrianca(''); setNomeResponsavel(''); setContatoResponsavel('');
      carregarDados();
    } catch (e) { alert("Erro ao fazer Check-in."); }
  };

  const iniciarCheckOut = (sessao: Sessao, cliente: Cliente) => {
    // Calculo básico do valor base (Encontra a tabela correspondente)
    const precoBase = precos.find(p => p.minutos === sessao.tempo_contratado);
    setValorCobrado(precoBase?.valor || 0);
    setFormaPagamento('PIX');
    setShowModalOut({sessao, cliente});
  };

  const processarCheckoutFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showModalOut) return;
    
    try {
      await api.post(`/sessoes/finalizar/${showModalOut.sessao.id}`, {
        valor_pago: valorCobrado,
        forma_pagamento: formaPagamento
      });
      setShowModalOut(null);
      carregarDados();
    } catch (e) { alert("Erro no checkout."); }
  };

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Play size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">{configuracao?.nome_empresa || "Parque Manager"}</h1>
            <p className="text-sm font-medium text-slate-500">
              Operador: <strong className="text-indigo-600 capitalize">{user?.username}</strong> 
              {user?.role === 'adm' && ' (Admin)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {user?.role === 'adm' && (
              <>
                <Link to="/relatorios" className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Relatórios">
                  <BarChart3 size={22} />
                </Link>
                <Link to="/configuracoes" className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Configurações">
                  <Settings size={22} />
                </Link>
              </>
            )}
            <button onClick={onLogout} className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
              <LogOut size={22} />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold border transition-colors ${
            caixaAberto ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            <Wallet size={18} /> {caixaAberto ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
          </div>
          <button 
            onClick={toggleCaixa}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
              caixaAberto ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            {caixaAberto ? 'Fechar Turno' : 'Abrir Turno...'}
          </button>
        </div>
      </header>

      {/* ACTION BAR */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Painel ao Vivo</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">{sessoes.length} crianças ativas no parque</p>
        </div>
        <button 
          onClick={() => setShowModalIn(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus size={22} className="stroke-[3]" /> Novo Check-in
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {sessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma criança no momento</h3>
            <p className="text-slate-500">Clique em Novo Check-in para iniciar um cronômetro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...sessoes].sort((a, b) => {
              const fimA = new Date(a.horario_inicio+"Z").getTime() + a.tempo_contratado * 60 * 1000;
              const fimB = new Date(b.horario_inicio+"Z").getTime() + b.tempo_contratado * 60 * 1000;
              return fimA - fimB; // quem termina primeiro fica no topo
            }).map(sessao => {
              const cli = clientes.find(c => c.id === sessao.cliente_id) as Cliente;
              return <SessionCard key={sessao.id} sessao={sessao} cliente={cli} onCheckOut={iniciarCheckOut} />;
            })}
          </div>
        )}
      </main>

      {/* MODAL CHECK-IN */}
      {showModalIn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><Plus size={20} className="stroke-[3]" /></div>
                Realizar Check-in
              </h2>
              <button onClick={() => setShowModalIn(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCheckIn} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Criança</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Enzo" value={nomeCrianca} onChange={e => setNomeCrianca(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Responsável</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nome Completo" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefone/Whatsapp</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(11) 99999-9999" value={contatoResponsavel} onChange={e => setContatoResponsavel(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                  Tabela / Tempo
                  <Link to="/configuracoes" className="text-indigo-600 text-xs font-bold hover:underline">Editar Valores</Link>
                </label>
                {precos.length === 0 ? (
                    <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-200">
                      Nenhuma tabela de preço cadastrada no sistema. Vá em configurações e adicione os minutos e valores!
                    </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 hover:cursor-pointer">
                    {precos.map(p => (
                      <div key={p.id} onClick={() => setTempoSelecionado(p)} className={`p-3 rounded-xl font-bold border transition-all active:scale-95 flex flex-col justify-center items-center ${ tempoSelecionado?.id === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' }`}> 
                        <span className="text-lg">{p.minutos} min</span>
                        <span className={`text-xs ${tempoSelecionado?.id === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>R$ {p.valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-2 mt-4 flex gap-3">
                <button type="submit" disabled={precos.length === 0} className="w-full py-4 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 flex justify-center items-center gap-2 shadow-xl shadow-emerald-500/30 disabled:opacity-50"> 
                  <CheckCircle2 size={20} /> Liberar Acesso da Criança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECK-OUT (COBRANÇA POS-PAGA) */}
      {showModalOut && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
             
             <div className="p-8 text-center bg-indigo-600 text-white rounded-b-[40px] shadow-lg relative">
               <button onClick={() => setShowModalOut(null)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10">
                 <X size={24} />
               </button>
               <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                 <DollarSign size={32} />
               </div>
               <h2 className="text-xl font-bold text-white/90">Finalizar Sessão de</h2>
               <h1 className="text-3xl font-black">{showModalOut.cliente.nome_crianca}</h1>
               <div className="mt-4 inline-flex px-4 py-1.5 bg-indigo-800/40 rounded-full font-bold text-sm tracking-wide">
                 Tempo Contratado: {showModalOut.sessao.tempo_contratado}min
               </div>
             </div>

             <form onSubmit={processarCheckoutFinal} className="p-8 space-y-6">
               
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Valor Total Apurado (R$)</label>
                  <div className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 ring-indigo-500">
                    <div className="bg-slate-100 px-4 py-4 font-bold text-slate-500 border-r border-slate-200 flex items-center">
                      R$
                    </div>
                    <input type="number" step="0.01" required value={valorCobrado} onChange={(e) => setValorCobrado(parseFloat(e.target.value))} className="w-full px-4 py-4 bg-transparent outline-none font-black text-slate-800 text-xl" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Você pode aplicar descontos ou multas alterando o valor final antes de cobrar.</p>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-3">Forma de Pagamento (Recebido na Conta)</label>
                 <div className="grid grid-cols-2 gap-3">
                   {['PIX', 'Débito', 'Crédito', 'Dinheiro'].map(fp => (
                     <button type="button" key={fp} onClick={() => setFormaPagamento(fp)} className={`py-3 rounded-xl border font-bold transition-all active:scale-95 ${formaPagamento === fp ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-800/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                       {fp}
                     </button>
                   ))}
                 </div>
               </div>

               <button type="submit" className="w-full py-4 mt-4 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 flex justify-center items-center gap-2 shadow-xl shadow-emerald-500/30">
                 Confirmo o Recebimento
               </button>

             </form>
           </div>
         </div>
      )}

    </div>
  );
}

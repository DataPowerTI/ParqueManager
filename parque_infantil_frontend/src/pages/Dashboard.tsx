import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, Wallet, Clock, User, X, CheckCircle2, LogOut, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// -- Interfaces e Hooks (Mesmos que existiam antes)
interface Sessao {
  id: string;
  nomeCrianca: string;
  nomeResponsavel: string;
  contatoResponsavel: string;
  tempoContratado: number;
  startTime: number;
}

const parseTime = (milliseconds: number) => {
  const isNegative = milliseconds < 0;
  const absMs = Math.abs(milliseconds);
  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const useSessionTimer = (startTime: number, tempoContratado: number) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [colorClass, setColorClass] = useState("bg-blue-500 text-white border-blue-600");

  useEffect(() => {
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
  }, [startTime, tempoContratado]);

  return { timeLeft, colorClass };
};

const SessionCard = ({ sessao, onFinalizar }: { sessao: Sessao; onFinalizar: (id: string) => void }) => {
  const { timeLeft, colorClass: bgClass } = useSessionTimer(sessao.startTime, sessao.tempoContratado);
  const isLightText = !bgClass.includes('text-yellow-900');
  return (
    <div className={`rounded-2xl shadow-xl border p-5 flex flex-col justify-between transition-colors duration-300 ${bgClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-xl flex items-center gap-2">
            <User size={20} className={isLightText ? "text-white/80" : "text-yellow-700"} />
            {sessao.nomeCrianca}
          </h3>
          <p className={`text-sm mt-1 font-medium flex items-center gap-2 ${isLightText ? "text-white/80" : "text-yellow-800"}`}>
            Resp: {sessao.nomeResponsavel}
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
          onClick={() => onFinalizar(sessao.id)}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95 ${
            isLightText ? "bg-white text-slate-800 hover:bg-slate-50" : "bg-yellow-900 text-yellow-50 hover:bg-yellow-800"
          }`}
        >
          <Square size={18} fill="currentColor" />
          Finalizar
        </button>
      </div>
    </div>
  );
};

// -- Main Component
export default function Dashboard() {
  const { user, configuracao, logout } = useAuth();
  const navigate = useNavigate();

  const [caixaAberto, setCaixaAberto] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);

  const [nomeCrianca, setNomeCrianca] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [tempo, setTempo] = useState<number>(30);

  useEffect(() => {
    const now = Date.now();
    setSessoes([
      { id: '1', nomeCrianca: 'Beatriz', nomeResponsavel: 'Mariana (Mãe)', contatoResponsavel: '11', tempoContratado: 60, startTime: now - (15 * 60 * 1000) },
      { id: '2', nomeCrianca: 'João Paulo', nomeResponsavel: 'Carlos (Pai)', contatoResponsavel: '11', tempoContratado: 30, startTime: now - (18 * 60 * 1000) },
      { id: '3', nomeCrianca: 'Enzo', nomeResponsavel: 'Valentina (Mãe)', contatoResponsavel: '11', tempoContratado: 30, startTime: now - (25 * 60 * 1000) },
      { id: '4', nomeCrianca: 'Pedro', nomeResponsavel: 'Roberto (Avô)', contatoResponsavel: '11', tempoContratado: 30, startTime: now - (32 * 60 * 1000) }
    ]);
  }, []);

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto) {
      alert("⚠️ Você precisa abrir o caixa para realizar o check-in.");
      return;
    }
    const novaSessao: Sessao = {
      id: Math.random().toString(36).substr(2, 9),
      nomeCrianca, nomeResponsavel, contatoResponsavel, tempoContratado: tempo, startTime: Date.now()
    };
    setSessoes([...sessoes, novaSessao]);
    setShowModal(false);
    setNomeCrianca(''); setNomeResponsavel(''); setContatoResponsavel(''); setTempo(30);
  };

  const finalizarSessao = (id: string) => {
    setSessoes(sessoes.filter(s => s.id !== id));
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
            caixaAberto ? 'bg-emerald-50 text-emerald-600 border-emerald-200 mask' : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            <Wallet size={18} /> {caixaAberto ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
          </div>
          <button 
            onClick={() => setCaixaAberto(!caixaAberto)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
              caixaAberto ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-400'
            }`}
          >
            {caixaAberto ? 'Fechar Turno' : 'Abrir Turno'}
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
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus size={22} className="stroke-[3]" /> Novo Check-in
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {sessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nenhuma atividade agora</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...sessoes].sort((a, b) => {
              const fimA = a.startTime + a.tempoContratado * 60 * 1000;
              const fimB = b.startTime + b.tempoContratado * 60 * 1000;
              return fimA - fimB;
            }).map(sessao => (
              <SessionCard key={sessao.id} sessao={sessao} onFinalizar={finalizarSessao} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><Plus size={20} className="stroke-[3]" /></div>
                Realizar Check-in
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCheckIn} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Criança</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Enzo" value={nomeCrianca} onChange={e => setNomeCrianca(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome do Responsável</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Roberto" value={nomeResponsavel} onChange={e => setNomeResponsavel(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Contato (Telefone/CPF)</label>
                <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(11) 99999-9999" value={contatoResponsavel} onChange={e => setContatoResponsavel(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tempo Contratado (Minutos)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 120].map(t => (
                    <button key={t} type="button" onClick={() => setTempo(t)} className={`py-2.5 rounded-xl font-bold border transition-all active:scale-95 ${ tempo === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' }`}> {t}m </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 mt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"> Cancelar </button>
                <button type="submit" className="flex-[2] py-3.5 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/30"> <CheckCircle2 size={20} /> Iniciar Sessão </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

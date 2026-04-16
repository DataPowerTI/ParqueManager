import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';

function ProtectedRoute({ children, reqRole }: { children: JSX.Element, reqRole?: string }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (reqRole && user.role !== reqRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute reqRole="adm">
          <Configuracoes />
        </ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute reqRole="adm">
          <Relatorios />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;

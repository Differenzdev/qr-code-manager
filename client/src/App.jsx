import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Loading QR Code Management System...</p>
      </div>
    );
  }

  return isAuthenticated ? <DashboardView /> : <LoginView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

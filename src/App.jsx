import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import PinLogin from './components/PinLogin';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import InvoiceList from './components/InvoiceList';
import Parties from './components/Parties';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

function TitleBar() {
  const api = window.electronAPI;
  const handleMinimize = () => api?.minimize();
  const handleMaximize = () => api?.maximize();
  const handleClose = () => api?.close();

  return (
    <div className="h-9 bg-dark-card border-b border-dark-border flex items-center justify-between titlebar-drag no-print">
      <div className="flex items-center gap-2 px-3 titlebar-nodrag">
        <div className="w-3 h-3 rounded-full gradient-primary shadow-glow" />
        <span className="text-xs text-surface-500 font-medium">APMC Unjha Billing</span>
      </div>
      <div className="flex titlebar-nodrag">
        <button onClick={handleMinimize} className="px-3 h-9 hover:bg-dark-hover transition-colors text-surface-500 hover:text-white">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleMaximize} className="px-3 h-9 hover:bg-dark-hover transition-colors text-surface-500 hover:text-white">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleClose} className="px-3 h-9 hover:bg-red-600 transition-colors text-surface-500 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, currentPage } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) return <PinLogin />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'billing': return <Billing />;
      case 'invoices': return <InvoiceList />;
      case 'parties': return <Parties />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-hidden bg-dark-bg">
          <AnimatePresence mode="wait">
            <motion.div key={currentPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="h-full">
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

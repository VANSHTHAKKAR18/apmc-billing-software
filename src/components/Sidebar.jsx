import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS } from '../utils/helpers';
import {
  LayoutDashboard, FilePlus, FileText, Users, BarChart3, Settings,
  LogOut, Sun, Moon, Globe, ChevronLeft
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { id: 'billing', icon: FilePlus, key: 'newBill' },
  { id: 'invoices', icon: FileText, key: 'invoices' },
  { id: 'parties', icon: Users, key: 'parties' },
  { id: 'reports', icon: BarChart3, key: 'reports' },
  { id: 'settings', icon: Settings, key: 'settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { currentPage, setCurrentPage, setIsAuthenticated, theme, toggleTheme, language, toggleLanguage } = useApp();
  const labels = LABELS[language] || LABELS.en;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-dark-card border-r border-dark-border relative z-20"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-dark-border min-h-[64px]">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-bold text-sm text-white leading-tight">APMC Unjha</h2>
            <p className="text-[10px] text-surface-500 font-gujarati">કમિશન બિલિંગ</p>
          </motion.div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <motion.button key={item.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-700/20 text-primary-400 border border-primary-700/30'
                  : 'text-surface-500 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{labels[item.key]}</span>
              )}
              {isActive && !collapsed && (
                <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-dark-border space-y-1">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-surface-500 hover:text-white hover:bg-dark-hover transition-all text-sm">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{theme === 'dark' ? labels.lightMode : labels.darkMode}</span>}
        </button>
        <button onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-surface-500 hover:text-white hover:bg-dark-hover transition-all text-sm">
          <Globe className="w-4 h-4" />
          {!collapsed && <span>{language === 'en' ? 'ગુજરાતી' : 'English'}</span>}
        </button>
        <button onClick={() => setIsAuthenticated(false)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Lock</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-elevated border border-dark-border flex items-center justify-center text-surface-500 hover:text-white transition-all z-30">
        <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </motion.aside>
  );
}

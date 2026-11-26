import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS, formatCurrency, formatDate } from '../utils/helpers';
import {
  TrendingUp, IndianRupee, Calendar, BarChart3, Package,
  ArrowUpRight, ArrowDownRight, Users, FileText, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#E74C3C', '#D4A843', '#3498DB', '#2ECC71', '#9B59B6'];

export default function Dashboard() {
  const { api, language, currentPage, setCurrentPage, setSelectedInvoice } = useApp();
  const labels = LABELS[language] || LABELS.en;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reload stats every time this component mounts (navigated to)
  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: labels.totalCommission, value: formatCurrency(stats.total.total_commission), icon: TrendingUp, color: 'from-primary-700 to-primary-500', change: '+12%' },
    { label: labels.todayCommission, value: formatCurrency(stats.today.commission), icon: Calendar, color: 'from-emerald-700 to-emerald-500', change: stats.today.invoices + ' bills' },
    { label: labels.monthlyCommission, value: formatCurrency(stats.month.commission), icon: BarChart3, color: 'from-blue-700 to-blue-500', change: stats.month.invoices + ' bills' },
    { label: labels.yearlyCommission, value: formatCurrency(stats.year.commission), icon: IndianRupee, color: 'from-purple-700 to-purple-500', change: stats.year.invoices + ' bills' },
    { label: labels.totalSales, value: formatCurrency(stats.total.total_sales), icon: Package, color: 'from-amber-700 to-amber-500', change: stats.total.total_invoices + ' total' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className="h-full overflow-y-auto p-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{labels.dashboard}</h1>
          <p className="text-surface-500 text-sm mt-1">Commission overview & analytics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-surface-400">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={itemVariants} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="badge bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> {card.change}
                </span>
              </div>
              <p className="text-surface-400 text-sm mb-1">{card.label}</p>
              <p className="text-2xl font-display font-bold">{card.value}</p>
              {/* Decorative gradient */}
              <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Commission Timeline */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" /> Commission Timeline
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.monthlyTrend}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252838" />
              <XAxis dataKey="month" stroke="#868E96" fontSize={12} />
              <YAxis stroke="#868E96" fontSize={12} tickFormatter={v => '₹' + (v/1000) + 'K'} />
              <Tooltip contentStyle={{ background:'#1A1D2B', border:'1px solid #252838', borderRadius:12, color:'#F1F3F5' }}
                formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="commission" stroke="#E74C3C" fill="url(#commGrad)" strokeWidth={2} name="Commission" />
              <Area type="monotone" dataKey="sales" stroke="#D4A843" fill="url(#salesGrad)" strokeWidth={2} name="Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue vs Commission */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold-400" /> Revenue vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252838" />
              <XAxis dataKey="month" stroke="#868E96" fontSize={12} />
              <YAxis stroke="#868E96" fontSize={12} tickFormatter={v => '₹' + (v/1000) + 'K'} />
              <Tooltip contentStyle={{ background:'#1A1D2B', border:'1px solid #252838', borderRadius:12, color:'#F1F3F5' }}
                formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="commission" fill="#E74C3C" radius={[4,4,0,0]} name="Commission" />
              <Bar dataKey="expenses" fill="#D4A843" radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Parties */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> {labels.topParties}
          </h3>
          <div className="space-y-3">
            {stats.topParties.length === 0 && <p className="text-surface-500 text-sm">No data yet</p>}
            {stats.topParties.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: COLORS[i] + '20', color: COLORS[i] }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-surface-500">{p.invoice_count} bills</p>
                </div>
                <p className="text-sm font-semibold text-gold-400">{formatCurrency(p.total_commission)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Highest Commission Bills */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> {labels.highestBills}
          </h3>
          <div className="space-y-3">
            {stats.highestBills.length === 0 && <p className="text-surface-500 text-sm">No data yet</p>}
            {stats.highestBills.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary-700/20 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.invoice_number}</p>
                  <p className="text-xs text-surface-500">{b.party_name}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(b.commission_amount)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Bills */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" /> {labels.recentBills}
          </h3>
          <div className="space-y-3">
            {stats.recentBills.length === 0 && <p className="text-surface-500 text-sm">No bills yet. Create your first bill!</p>}
            {stats.recentBills.slice(0, 5).map((b, i) => (
              <div key={i} onClick={() => { setSelectedInvoice(b); setCurrentPage('invoices'); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.party_name || 'Walk-in'}</p>
                  <p className="text-xs text-surface-500">{formatDate(b.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(b.total_amount)}</p>
                  <p className="text-xs text-primary-400">{formatCurrency(b.commission_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

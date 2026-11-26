import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS, formatCurrency, formatDate, formatWeight } from '../utils/helpers';
import {
  BarChart3, Calendar, Filter, Download, IndianRupee, Package,
  Truck, Percent, TrendingUp, FileText, Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#E74C3C', '#D4A843', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22'];

export default function Reports() {
  const { api, language, parties, loadParties } = useApp();
  const labels = LABELS[language] || LABELS.en;
  const [filters, setFilters] = useState({ partyId: '', startDate: '', endDate: '', product: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadParties(); generateReport(); }, []);

  const generateReport = async () => {
    setLoading(true);
    const data = await api.generateReport({
      partyId: filters.partyId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      product: filters.product || undefined,
    });
    setReport(data);
    setLoading(false);
  };

  const handleFilter = () => generateReport();

  const partyBreakdown = useMemo(() => {
    if (!report?.invoices?.length) return [];
    const map = {};
    report.invoices.forEach(i => {
      const name = i.party_name || 'Walk-in';
      if (!map[name]) map[name] = { name, commission: 0, sales: 0, count: 0 };
      map[name].commission += i.commission_amount;
      map[name].sales += i.total_amount;
      map[name].count++;
    });
    return Object.values(map).sort((a, b) => b.commission - a.commission).slice(0, 8);
  }, [report]);

  const summary = report?.summary || {};

  return (
    <motion.div className="h-full overflow-y-auto p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary-400" /> {labels.reports}
        </h1>
        <p className="text-surface-500 text-sm mt-1">Commission & revenue analytics</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-surface-400 mb-1 block">Party</label>
            <select value={filters.partyId} onChange={e => setFilters({...filters, partyId:e.target.value})} className="input-field text-sm">
              <option value="">All Parties</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-surface-400 mb-1 block">From Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate:e.target.value})} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs text-surface-400 mb-1 block">To Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate:e.target.value})} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs text-surface-400 mb-1 block">Product</label>
            <select value={filters.product} onChange={e => setFilters({...filters, product:e.target.value})} className="input-field text-sm">
              <option value="">All Products</option>
              <option value="Jeera">Jeera</option>
              <option value="Variyali">Variyali</option>
              <option value="Ajmo">Ajmo</option>
            </select>
          </div>
          <button onClick={handleFilter} className="btn-primary text-sm flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Sales', value: formatCurrency(summary.total_sales), icon: IndianRupee, color: 'text-gold-400' },
          { label: 'Commission', value: formatCurrency(summary.total_commission), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Transport', value: formatCurrency(summary.total_transport), icon: Truck, color: 'text-blue-400' },
          { label: 'Other Exp.', value: formatCurrency(summary.total_other_expense), icon: Package, color: 'text-purple-400' },
          { label: 'Payable', value: formatCurrency(summary.total_payable), icon: IndianRupee, color: 'text-primary-400' },
          { label: 'Weight', value: formatWeight(summary.total_weight), icon: Package, color: 'text-amber-400' },
          { label: 'Bills', value: summary.invoice_count || 0, icon: FileText, color: 'text-cyan-400' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              className="glass-card p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${c.color}`} />
              <p className="text-xs text-surface-500 mb-1">{c.label}</p>
              <p className="font-bold text-sm">{c.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Party Breakdown Bar */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Commission by Party
          </h3>
          {partyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={partyBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#252838" />
                <XAxis type="number" stroke="#868E96" fontSize={11} tickFormatter={v => '₹' + (v/1000) + 'K'} />
                <YAxis type="category" dataKey="name" stroke="#868E96" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background:'#1A1D2B', border:'1px solid #252838', borderRadius:12, color:'#F1F3F5' }}
                  formatter={v => formatCurrency(v)} />
                <Bar dataKey="commission" fill="#E74C3C" radius={[0,4,4,0]} name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-surface-500 text-sm py-12 text-center">No data available</p>}
        </div>

        {/* Commission Pie */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-gold-400" /> Commission Distribution
          </h3>
          {partyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={partyBreakdown} dataKey="commission" nameKey="name"
                  cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} label={({ name }) => name}>
                  {partyBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)}
                  contentStyle={{ background:'#1A1D2B', border:'1px solid #252838', borderRadius:12, color:'#F1F3F5' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-surface-500 text-sm py-12 text-center">No data available</p>}
        </div>
      </div>

      {/* Invoice Table */}
      {report?.invoices?.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-semibold">Detailed Transactions ({report.invoices.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border bg-dark-elevated/30">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Invoice</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Party</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-surface-400">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Weight</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Amount</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Commission</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-surface-400">Payable</th>
                </tr>
              </thead>
              <tbody>
                {report.invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-dark-border/30 hover:bg-dark-hover/30">
                    <td className="px-3 py-2 font-mono text-primary-400">{inv.invoice_number}</td>
                    <td className="px-3 py-2">{inv.party_name || 'Walk-in'}</td>
                    <td className="px-3 py-2 text-surface-400">{formatDate(inv.date)}</td>
                    <td className="px-3 py-2 text-right">{inv.weight_kg} KG</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400">{formatCurrency(inv.commission_amount)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-gold-400">{formatCurrency(inv.final_payable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

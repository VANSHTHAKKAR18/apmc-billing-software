import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS, formatCurrency } from '../utils/helpers';
import {
  Users, Search, UserPlus, Edit2, Trash2, Phone, MapPin,
  Package, IndianRupee, FileText, X, Check, TrendingUp
} from 'lucide-react';

export default function Parties() {
  const { api, language, loadParties, parties, setCurrentPage } = useApp();
  const labels = LABELS[language] || LABELS.en;
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', mobile:'', address:'', product:'Jeera', notes:'' });
  const [partyStats, setPartyStats] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { loadParties(); }, []);

  const filtered = parties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.mobile || '').includes(search)
  );

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await api.updateParty(editId, form);
    } else {
      await api.createParty(form);
    }
    await loadParties();
    setShowForm(false);
    setEditId(null);
    setForm({ name:'', mobile:'', address:'', product:'Jeera', notes:'' });
  };

  const handleEdit = (p) => {
    setForm({ name:p.name, mobile:p.mobile||'', address:p.address||'', product:p.product||'Jeera', notes:p.notes||'' });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.deleteParty(deleteId);
    await loadParties();
    setDeleteId(null);
    if (selectedId === deleteId) setSelectedId(null);
  };

  const handleSelect = async (id) => {
    setSelectedId(id === selectedId ? null : id);
    if (id !== selectedId) {
      const stats = await api.getPartyStats(id);
      setPartyStats(prev => ({ ...prev, [id]: stats }));
    }
  };

  return (
    <motion.div className="h-full overflow-y-auto p-6" initial={{ opacity:0 }} animate={{ opacity:1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-400" /> {labels.parties}
          </h1>
          <p className="text-surface-500 text-sm mt-1">{parties.length} parties registered</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name:'', mobile:'', address:'', product:'Jeera', notes:'' }); }}
          className="btn-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> {labels.addParty}
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search parties..." className="input-field pl-12" />
        </div>
      </div>

      {/* Party Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => {
          const stats = partyStats[p.id];
          const isSelected = selectedId === p.id;
          return (
            <motion.div key={p.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary-600/50 shadow-glow' : 'hover:border-dark-hover'}`}
              onClick={() => handleSelect(p.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    {p.mobile && <p className="text-xs text-surface-500 flex items-center gap-1"><Phone className="w-3 h-3" />{p.mobile}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={e => { e.stopPropagation(); handleEdit(p); }}
                    className="p-1.5 rounded-lg hover:bg-dark-hover text-surface-400 hover:text-blue-400">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {p.address && <p className="text-xs text-surface-500 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{p.address}</p>}
              <div className="flex items-center gap-2">
                <span className="badge bg-primary-700/20 text-primary-400"><Package className="w-3 h-3 mr-1" />{p.product}</span>
              </div>

              {/* Expanded Stats */}
              <AnimatePresence>
                {isSelected && stats && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-dark-border grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded-lg bg-dark-elevated/50">
                        <p className="text-xs text-surface-500">Bills</p>
                        <p className="font-bold text-sm">{stats.total_invoices}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-elevated/50">
                        <p className="text-xs text-surface-500">Sales</p>
                        <p className="font-bold text-sm text-gold-400">{formatCurrency(stats.total_sales)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-elevated/50">
                        <p className="text-xs text-surface-500">Commission</p>
                        <p className="font-bold text-sm text-emerald-400">{formatCurrency(stats.total_commission)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-elevated/50">
                        <p className="text-xs text-surface-500">Payable</p>
                        <p className="font-bold text-sm text-primary-400">{formatCurrency(stats.total_payable)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-surface-500">No parties found</div>
        )}
      </div>

      {/* Add/Edit Party Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg">{editId ? 'Edit Party' : 'Add New Party'}</h3>
                <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                  placeholder="Party Name *" className="input-field" autoFocus />
                <input type="text" value={form.mobile} onChange={e => setForm({...form, mobile:e.target.value})}
                  placeholder="Mobile Number" className="input-field" />
                <input type="text" value={form.address} onChange={e => setForm({...form, address:e.target.value})}
                  placeholder="Address" className="input-field" />
                <select value={form.product} onChange={e => setForm({...form, product:e.target.value})} className="input-field">
                  <option value="Jeera">Jeera</option>
                  <option value="Variyali">Variyali</option>
                  <option value="Ajmo">Ajmo</option>
                  <option value="Other">Other</option>
                </select>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}
                  placeholder="Notes" rows={2} className="input-field resize-none" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleSave} disabled={!form.name.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  <Check className="w-4 h-4 inline mr-1" /> {editId ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm">
              <h3 className="font-semibold mb-2">Delete Party?</h3>
              <p className="text-sm text-surface-400 mb-4">This will remove the party from your records.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

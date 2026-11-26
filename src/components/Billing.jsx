import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS, formatCurrency, calculateMultiItemInvoice } from '../utils/helpers';
import {
  FileText, Save, UserPlus, Package,
  Scale, IndianRupee, Truck, Percent, Calculator, X, Check, Plus, Trash2
} from 'lucide-react';

const EMPTY_ITEM = { product: 'Jeera', weight_kg: '', rate: '' };

export default function Billing() {
  const { api, language, loadParties, parties, headers, loadHeaders, editingInvoice, setEditingInvoice, setCurrentPage } = useApp();
  const labels = LABELS[language] || LABELS.en;

  const [form, setForm] = useState({
    party_id: '', bill_header_id: '',
    transport_expense: '', other_expense: '',
    commission_percent: '5', notes: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [newParty, setNewParty] = useState({ name: '', mobile: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  useEffect(() => {
    loadParties();
    loadHeaders();
    loadDefaultCommission();
  }, []);

  useEffect(() => {
    if (editingInvoice) {
      setForm({
        party_id: editingInvoice.party_id || '',
        bill_header_id: editingInvoice.bill_header_id || '',
        transport_expense: String(editingInvoice.transport_expense || ''),
        other_expense: String(editingInvoice.other_expense || ''),
        commission_percent: String(editingInvoice.commission_percent || '5'),
        notes: editingInvoice.notes || '',
      });
      // Load items from stored data
      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setItems(editingInvoice.items.map(it => ({
          product: it.product || 'Jeera',
          weight_kg: String(it.weight_kg || ''),
          rate: String(it.rate || ''),
        })));
      } else {
        // Legacy single-item invoice
        setItems([{
          product: editingInvoice.product || 'Jeera',
          weight_kg: String(editingInvoice.weight_kg || ''),
          rate: String(editingInvoice.rate || ''),
        }]);
      }
    }
  }, [editingInvoice]);

  const loadDefaultCommission = async () => {
    const dc = await api.getSetting('default_commission');
    if (dc && !editingInvoice) setForm(f => ({ ...f, commission_percent: dc }));
    const dh = await api.getDefaultHeader();
    if (dh && !editingInvoice) setForm(f => ({ ...f, bill_header_id: String(dh.id) }));
  };

  // Multi-item calculation
  const calc = useMemo(() =>
    calculateMultiItemInvoice(items, form.transport_expense, form.other_expense, form.commission_percent),
    [items, form.transport_expense, form.other_expense, form.commission_percent]
  );

  const filteredParties = useMemo(() =>
    parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())),
    [parties, partySearch]
  );

  const selectedParty = parties.find(p => p.id === Number(form.party_id));

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  // Item management
  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddParty = async () => {
    if (!newParty.name.trim()) return;
    const created = await api.createParty({ ...newParty, product: 'Jeera' });
    await loadParties();
    setForm(f => ({ ...f, party_id: String(created.id) }));
    setNewParty({ name: '', mobile: '', address: '' });
    setShowPartyForm(false);
  };

  const hasValidItems = items.some(it => it.weight_kg && it.rate);

  const handleSave = async () => {
    if (!hasValidItems || !form.commission_percent) return;
    setSaving(true);
    try {
      const validItems = items.filter(it => parseFloat(it.weight_kg) > 0 && parseFloat(it.rate) > 0).map(it => ({
        product: it.product,
        weight_kg: parseFloat(it.weight_kg),
        rate: parseFloat(it.rate),
        amount: parseFloat(it.weight_kg) * parseFloat(it.rate),
      }));
      const invoiceData = {
        party_id: form.party_id ? Number(form.party_id) : null,
        bill_header_id: form.bill_header_id ? Number(form.bill_header_id) : null,
        items: validItems,
        product: validItems.map(i => i.product).join(', '),
        weight_kg: calc.totalWeight,
        rate: validItems.length === 1 ? validItems[0].rate : 0,
        total_amount: calc.totalAmount,
        transport_expense: parseFloat(form.transport_expense) || 0,
        other_expense: parseFloat(form.other_expense) || 0,
        commission_percent: parseFloat(form.commission_percent),
        commission_amount: calc.commissionAmount,
        final_payable: calc.finalPayable,
        notes: form.notes,
      };
      if (editingInvoice) {
        await api.updateInvoice(editingInvoice.id, invoiceData);
      } else {
        await api.createInvoice(invoiceData);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        if (!editingInvoice) {
          setForm(f => ({ ...f, party_id: '', notes: '' }));
          setItems([{ ...EMPTY_ITEM }]);
        }
        setEditingInvoice(null);
        setCurrentPage('invoices');
      }, 1200);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <motion.div className="h-full overflow-y-auto p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              <FileText className="w-7 h-7 text-primary-400" />
              {editingInvoice ? 'Edit Bill' : labels.newBill}
            </h1>
            <p className="text-surface-500 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Form */}
          <div className="lg:col-span-2 space-y-4">


            {/* Party Selection */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-surface-300">{labels.selectParty}</h3>
                <button onClick={() => setShowPartyForm(!showPartyForm)} className="btn-ghost text-xs flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> {labels.addParty}
                </button>
              </div>
              <div className="relative">
                <input type="text" value={selectedParty ? selectedParty.name : partySearch}
                  onChange={e => { setPartySearch(e.target.value); handleChange('party_id', ''); setShowPartyDropdown(true); }}
                  onFocus={() => setShowPartyDropdown(true)}
                  placeholder="Search party..." className="input-field" />
                {form.party_id && (
                  <button onClick={() => { handleChange('party_id', ''); setPartySearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <AnimatePresence>
                  {showPartyDropdown && !form.party_id && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute z-20 top-full mt-1 w-full bg-dark-elevated border border-dark-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredParties.map(p => (
                        <button key={p.id} onClick={() => { handleChange('party_id', String(p.id)); setShowPartyDropdown(false); setPartySearch(''); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-dark-hover text-sm flex justify-between items-center">
                          <span>{p.name}</span>
                          <span className="text-xs text-surface-500">{p.mobile}</span>
                        </button>
                      ))}
                      {filteredParties.length === 0 && <p className="px-4 py-3 text-surface-500 text-sm">No parties found</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Inline Add Party */}
              <AnimatePresence>
                {showPartyForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="mt-3 p-4 bg-dark-elevated/50 rounded-xl space-y-3">
                      <input type="text" value={newParty.name} onChange={e => setNewParty({ ...newParty, name: e.target.value })}
                        placeholder="Party Name" className="input-field text-sm" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={newParty.mobile} onChange={e => setNewParty({ ...newParty, mobile: e.target.value })}
                          placeholder="Mobile" className="input-field text-sm" />
                        <input type="text" value={newParty.address} onChange={e => setNewParty({ ...newParty, address: e.target.value })}
                          placeholder="Address" className="input-field text-sm" />
                      </div>
                      <button onClick={handleAddParty} className="btn-primary text-sm w-full py-2">
                        <Check className="w-4 h-4 inline mr-1" /> Add Party
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== MULTIPLE PRODUCT ROWS ===== */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-surface-300">Product Details</h3>
                <button onClick={addItem} className="btn-ghost text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                  <Plus className="w-3.5 h-3.5" /> Add Product Row
                </button>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 mb-2 px-1">
                <div className="col-span-1 text-xs text-surface-500 font-medium">#</div>
                <div className="col-span-3 text-xs text-surface-500 font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Product</div>
                <div className="col-span-3 text-xs text-surface-500 font-medium flex items-center gap-1"><Scale className="w-3 h-3" /> Weight (KG)</div>
                <div className="col-span-3 text-xs text-surface-500 font-medium flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Rate (₹/KG)</div>
                <div className="col-span-2 text-xs text-surface-500 font-medium text-right">Amount</div>
              </div>

              {/* Product Rows */}
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const amt = (parseFloat(item.weight_kg) || 0) * (parseFloat(item.rate) || 0);
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-12 gap-3 items-center p-2 rounded-xl bg-dark-elevated/40 hover:bg-dark-elevated/70 transition-colors">
                      {/* Row number & delete */}
                      <div className="col-span-1 flex items-center gap-1">
                        <span className="text-xs text-surface-500 font-mono w-4">{idx + 1}</span>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400/60 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {/* Product */}
                      <div className="col-span-3">
                        <select value={item.product} onChange={e => handleItemChange(idx, 'product', e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600">
                          <option value="Jeera">Jeera (જીરું)</option>
                          <option value="Variyali">Variyali (વરિયાળી)</option>
                          <option value="Ajmo">Ajmo (અજમો)</option>
                          <option value="Rai">Rai (રાઈ)</option>
                          <option value="Isabgul">Isabgul (ઈસબગુલ)</option>
                          <option value="Methi">Methi (મેથી)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {/* Weight */}
                      <div className="col-span-3">
                        <input type="number" value={item.weight_kg} onChange={e => handleItemChange(idx, 'weight_kg', e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600" />
                      </div>
                      {/* Rate */}
                      <div className="col-span-3">
                        <input type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                          placeholder="e.g. 250"
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600" />
                      </div>
                      {/* Amount */}
                      <div className="col-span-2 text-right">
                        <motion.span key={amt} initial={{ color: '#D4A843' }} animate={{ color: amt > 0 ? '#F1F3F5' : '#868E96' }}
                          className="text-sm font-mono font-semibold">
                          {amt > 0 ? formatCurrency(amt) : '₹0'}
                        </motion.span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add more button at bottom */}
              {items.length < 10 && (
                <button onClick={addItem}
                  className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-dark-border text-surface-500 hover:text-emerald-400 hover:border-emerald-400/30 transition-all text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add another product row
                </button>
              )}
            </div>

            {/* Expenses & Commission */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4 text-sm text-surface-300">Expenses & Commission</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-surface-400 font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" /> {labels.transportExpense}
                  </label>
                  <input type="number" value={form.transport_expense} onChange={e => handleChange('transport_expense', e.target.value)}
                    placeholder="₹0" className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-surface-400 font-medium flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> {labels.otherExpense}
                  </label>
                  <input type="number" value={form.other_expense} onChange={e => handleChange('other_expense', e.target.value)}
                    placeholder="₹0" className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-surface-400 font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4" /> {labels.commissionPercent}
                  </label>
                  <input type="number" value={form.commission_percent} onChange={e => handleChange('commission_percent', e.target.value)}
                    placeholder="5" className="input-field" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="glass-card p-5">
              <label className="text-sm text-surface-400 font-medium mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)}
                placeholder="Additional notes..." rows={2} className="input-field resize-none" />
            </div>
          </div>

          {/* Right - Live Calculation */}
          <div className="space-y-4">
            <div className="glass-card p-5 sticky top-6">
              <h3 className="font-display font-semibold mb-5 flex items-center gap-2 text-gold-400">
                <Calculator className="w-5 h-5" /> Live Calculation
              </h3>

              <div className="space-y-3">
                {/* Per-item breakdown */}
                {calc.items.filter(it => it.amount > 0).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-surface-300">{it.product}</p>
                      <p className="text-xs text-surface-600">{it.weight_kg} KG × ₹{it.rate}</p>
                    </div>
                    <span className="font-mono text-white">{formatCurrency(it.amount)}</span>
                  </div>
                ))}

                {/* Total Sale */}
                <div className="border-t border-dark-border pt-3">
                  <CalcRow label="Total Sale Amount" value={calc.totalAmount}
                    formula={`${calc.totalWeight} KG total`} highlight />
                </div>

                {/* Deductions */}
                <div className="border-t border-dark-border pt-3 space-y-2">
                  <CalcRow label={labels.transportExpense} value={parseFloat(form.transport_expense) || 0} negative />
                  <CalcRow label={labels.otherExpense} value={parseFloat(form.other_expense) || 0} negative />
                  <CalcRow label={`${labels.commissionAmount} (${form.commission_percent || 0}%)`}
                    value={calc.commissionAmount} negative />
                </div>

                {/* Final */}
                <div className="border-t-2 border-gold-400/30 pt-4">
                  <CalcRow label={labels.finalPayable} value={calc.finalPayable} final />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                  disabled={!hasValidItems || saving}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {saved ? <><Check className="w-5 h-5" /> Saved!</> :
                    saving ? 'Saving...' : <><Save className="w-5 h-5" /> {editingInvoice ? 'Update Bill' : 'Save Bill'}</>}
                </motion.button>
                {editingInvoice && (
                  <button onClick={() => { setEditingInvoice(null); setCurrentPage('invoices'); }}
                    className="btn-ghost w-full">{labels.cancel}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CalcRow({ label, value, formula, highlight, negative, final: isFinal }) {
  return (
    <div className={`flex items-center justify-between ${isFinal ? 'py-1' : ''}`}>
      <div>
        <p className={`text-sm ${isFinal ? 'font-display font-bold text-gold-400' : highlight ? 'font-semibold text-white' : 'text-surface-400'}`}>
          {label}
        </p>
        {formula && <p className="text-xs text-surface-600 mt-0.5">{formula}</p>}
      </div>
      <motion.p key={value} initial={{ scale: 1.1, color: '#D4A843' }}
        animate={{ scale: 1, color: isFinal ? '#D4A843' : negative ? '#E74C3C' : '#F1F3F5' }}
        className={`font-mono font-bold ${isFinal ? 'text-xl' : 'text-base'}`}>
        {negative && value > 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
      </motion.p>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS, formatCurrency, formatDate, formatDateTime } from '../utils/helpers';
import {
  Search, FileText, Eye, Edit2, Trash2, Copy, Download,
  Printer, AlertTriangle, X
} from 'lucide-react';

// Helper: get items array from invoice (supports old single-item + new multi-item)
function getInvoiceItems(inv) {
  let items = inv.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch(e) { items = null; }
  }
  if (Array.isArray(items) && items.length > 0) return items;
  return [{
    product: inv.product || 'Jeera',
    weight_kg: inv.weight_kg,
    rate: inv.rate,
    amount: inv.total_amount,
  }];
}

// Format number for PDF
function fmtNum(n, decimals = 2) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Generate A4 printable HTML for multi-item invoice (B&W)
function generateInvoiceHTML(inv) {
  const headerEn = inv.header_name_en || 'APMC UNJHA';
  const headerGu = inv.header_name_gu || '';
  const headerAddr = inv.header_address || 'APMC Market Yard, Unjha, Gujarat';
  const headerMobile = inv.header_mobile || '';
  const items = getInvoiceItems(inv);

  const itemRows = items.map((it, idx) => `
    <tr>
      <td style="text-align:center">${idx + 1}</td>
      <td>${it.product || 'Jeera'}</td>
      <td class="r">${fmtNum(it.weight_kg, 0)}</td>
      <td class="r">${fmtNum(it.rate, 2)}</td>
      <td class="r"><b>${fmtNum(it.amount || (it.weight_kg * it.rate), 2)}</b></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Bill - ${inv.invoice_number}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; font-size:13px; color:#000; background:#fff; }
  .bill { border:3px solid #000; padding:0; width:100%; max-width:190mm; margin:0 auto; }
  .header { border-bottom:3px solid #000; padding:16px 20px; text-align:center; }
  .header h1 { font-size:22px; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:2px; }
  .header .gu { font-family:'Noto Sans Gujarati',sans-serif; font-size:18px; font-weight:700; margin-bottom:4px; }
  .header .addr { font-size:11px; color:#333; }
  .header .mobile { font-size:11px; color:#333; margin-top:2px; }
  .meta { display:flex; justify-content:space-between; padding:10px 20px; border-bottom:2px solid #000; font-size:12px; }
  .meta b { font-weight:700; }
  .party { padding:10px 20px; border-bottom:2px solid #000; font-size:12px; background:#f8f8f8; }
  .party b { font-weight:700; }
  table { width:100%; border-collapse:collapse; }
  th { background:#000; color:#fff; padding:8px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
  th.r { text-align:right; }
  td { padding:7px 12px; border-bottom:1px solid #ccc; font-size:13px; }
  td.r { text-align:right; font-family:'Inter',monospace; }
  .total-row td { border-top:2px solid #000; font-weight:800; background:#f5f5f5; }
  .summary { padding:12px 20px; }
  .sum-row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
  .sum-row.deduct { color:#555; }
  .sum-row.total { border-top:3px solid #000; margin-top:8px; padding-top:10px; font-size:18px; font-weight:800; }
  .footer { border-top:2px solid #000; padding:12px 20px; display:flex; justify-content:space-between; font-size:10px; color:#666; }
  .signature { border-top:2px solid #000; padding:20px; display:flex; justify-content:space-between; }
  .sig-box { text-align:center; width:45%; }
  .sig-line { border-top:1px solid #000; margin-top:40px; padding-top:4px; font-size:11px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display:none !important; }
  }
</style>
</head><body>
<div class="bill">
  <div class="meta">
    <div><b>Bill No:</b> ${inv.invoice_number}</div>
    <div><b>Date:</b> ${new Date(inv.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} ${new Date(inv.date).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
  </div>
  ${inv.party_name ? `
  <div class="party">
    <b>Party:</b> ${inv.party_name}
    ${inv.party_mobile ? `&nbsp;&nbsp;|&nbsp;&nbsp;<b>Mo:</b> ${inv.party_mobile}` : ''}
    ${inv.party_address ? `&nbsp;&nbsp;|&nbsp;&nbsp;<b>Addr:</b> ${inv.party_address}` : ''}
  </div>` : ''}
  <table>
    <thead><tr>
      <th style="width:40px;text-align:center">#</th>
      <th>Product (માલ)</th><th class="r">Weight (વજન)</th><th class="r">Rate (ભાવ)</th><th class="r">Amount (રકમ)</th>
    </tr></thead>
    <tbody>
      ${itemRows}
      ${items.length > 1 ? `
      <tr class="total-row">
        <td colspan="2" style="text-align:right"><b>Total (કુલ)</b></td>
        <td class="r"><b>${fmtNum(inv.weight_kg || items.reduce((s,i) => s + Number(i.weight_kg), 0), 0)}</b></td>
        <td class="r"></td>
        <td class="r"><b>${fmtNum(inv.total_amount, 2)}</b></td>
      </tr>` : ''}
    </tbody>
  </table>
  <div class="summary">
    <div class="sum-row"><span>Total Sale Amount (કુલ વેચાણ રકમ)</span><span>₹${fmtNum(inv.total_amount)}</span></div>
    ${Number(inv.transport_expense) > 0 ? `<div class="sum-row deduct"><span>(-) Transport Expense (મજૂરી / ટ્રાન્સપોર્ટ)</span><span>₹${fmtNum(inv.transport_expense)}</span></div>` : ''}
    ${Number(inv.other_expense) > 0 ? `<div class="sum-row deduct"><span>(-) Other Expense (અન્ય ખર્ચ)</span><span>₹${fmtNum(inv.other_expense)}</span></div>` : ''}
    <div class="sum-row deduct"><span>(-) Commission (કમિશન) (${inv.commission_percent}%)</span><span>₹${fmtNum(inv.commission_amount)}</span></div>
    <div class="sum-row total"><span>Final Payable Amount (ચૂકવવાપાત્ર રકમ)</span><span>₹${fmtNum(inv.final_payable)}</span></div>
  </div>
  ${inv.notes ? `<div style="padding:8px 20px;border-top:1px solid #ccc;font-size:11px;color:#555;"><b>Notes:</b> ${inv.notes}</div>` : ''}
  <div class="signature">
    <div class="sig-box"><div class="sig-line">Receiver's Signature</div></div>
    <div class="sig-box"><div class="sig-line">Authorized Signature</div></div>
  </div>
</div>
<div class="no-print" style="text-align:center;padding:20px;font-family:Inter,sans-serif;">
  <button onclick="window.print()" style="padding:12px 32px;font-size:16px;font-weight:700;background:#000;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:12px;">🖨️ Print / Save as PDF</button>
  <button onclick="window.close()" style="padding:12px 32px;font-size:16px;font-weight:600;background:#eee;color:#333;border:1px solid #ccc;border-radius:8px;cursor:pointer;">Close</button>
  <p style="margin-top:12px;color:#888;font-size:12px;">Use Ctrl+P → "Save as PDF" to download as PDF file</p>
</div>
</body></html>`;
}

// Use Electron's native print API to generate PDF without annoying dialogs
async function openPrintWindow(inv, mode = 'print', api) {
  const html = generateInvoiceHTML(inv);
  
  if (window.electronAPI) {
    if (mode === 'pdf') {
      await window.electronAPI.savePdf(inv.invoice_number, html);
    } else {
      await window.electronAPI.printInvoice(html);
    }
  } else {
    // Fallback for web browser testing
    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
}

export default function InvoiceList() {
  const { api, language, setCurrentPage, setEditingInvoice } = useApp();
  const labels = LABELS[language] || LABELS.en;
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await api.getInvoices({});
    setInvoices(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() =>
    invoices.filter(i =>
      (i.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.party_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.product || '').toLowerCase().includes(search.toLowerCase())
    ), [invoices, search]);

  const handleEdit = (inv) => { setEditingInvoice(inv); setCurrentPage('billing'); };
  const handleDelete = async () => { if (!deleteId) return; await api.deleteInvoice(deleteId); setDeleteId(null); loadInvoices(); };
  const handleDuplicate = async (id) => { await api.duplicateInvoice(id); loadInvoices(); };
  const handleView = async (id) => { const full = await api.getInvoiceById(id); setViewInvoice(full); };
  const handlePrint = (inv) => { openPrintWindow(inv, 'print', api); };
  const handleDownloadPDF = (inv) => { openPrintWindow(inv, 'pdf', api); };

  return (
    <motion.div className="h-full overflow-y-auto p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary-400" /> {labels.invoices}
          </h1>
          <p className="text-surface-500 text-sm mt-1">{filtered.length} bills found</p>
        </div>
        <button onClick={() => { setEditingInvoice(null); setCurrentPage('billing'); }} className="btn-primary">
          + {labels.newBill}
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={labels.search} className="input-field pl-12" />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase">Party</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-400 uppercase">Commission</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-400 uppercase">Payable</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-surface-500">
                  {loading ? 'Loading...' : 'No invoices found. Create your first bill!'}
                </td></tr>
              )}
              {filtered.map((inv, i) => {
                const itemCount = inv.items ? inv.items.length : 1;
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-dark-border/50 hover:bg-dark-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-primary-400">{inv.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{inv.party_name || 'Walk-in'}</p>
                      <p className="text-xs text-surface-500">
                        {inv.product}{itemCount > 1 ? ` (${itemCount} items)` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-400">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-mono text-emerald-400">{formatCurrency(inv.commission_amount)}</span>
                      <span className="text-xs text-surface-500 ml-1">({inv.commission_percent}%)</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gold-400">
                      {formatCurrency(inv.final_payable)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleView(inv.id)} className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-white transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrint(inv)} className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-green-400 transition-colors" title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownloadPDF(inv)} className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-blue-400 transition-colors" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(inv)} className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-amber-400 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDuplicate(inv.id)} className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-purple-400 transition-colors" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeleteId(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete Invoice?</h3>
                  <p className="text-sm text-surface-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Invoice Modal — Multi-item B&W Preview */}
      <AnimatePresence>
        {viewInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewInvoice(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white text-black rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

              <div className="border-[3px] border-black m-4">
                {/* Bill Meta */}
                <div className="flex justify-between px-4 py-2 border-b-2 border-black text-xs">
                  <div><b>Bill No:</b> {viewInvoice.invoice_number}</div>
                  <div><b>Date:</b> {formatDateTime(viewInvoice.date)}</div>
                </div>

                {/* Party */}
                {viewInvoice.party_name && (
                  <div className="px-4 py-2 border-b-2 border-black text-xs bg-gray-50">
                    <b>Party:</b> {viewInvoice.party_name}
                    {viewInvoice.party_mobile && <span className="ml-3"><b>Mo:</b> {viewInvoice.party_mobile}</span>}
                  </div>
                )}

                {/* Multi-item Product Table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="p-2 text-center text-xs font-bold w-8">#</th>
                      <th className="p-2 text-left text-xs font-bold uppercase">Product (માલ)</th>
                      <th className="p-2 text-right text-xs font-bold uppercase">Weight (વજન)</th>
                      <th className="p-2 text-right text-xs font-bold uppercase">Rate (ભાવ)</th>
                      <th className="p-2 text-right text-xs font-bold uppercase">Amount (રકમ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getInvoiceItems(viewInvoice).map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2">{it.product}</td>
                        <td className="p-2 text-right">{it.weight_kg} KG</td>
                        <td className="p-2 text-right">{formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(it.amount || (it.weight_kg * it.rate))}</td>
                      </tr>
                    ))}
                    {getInvoiceItems(viewInvoice).length > 1 && (
                      <tr className="bg-gray-100 font-bold border-t-2 border-black">
                        <td colSpan={2} className="p-2 text-right">Total (કુલ)</td>
                        <td className="p-2 text-right">{viewInvoice.weight_kg} KG</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right">{formatCurrency(viewInvoice.total_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Total Sale Amount (કુલ વેચાણ રકમ)</span><span>{formatCurrency(viewInvoice.total_amount)}</span></div>
                  {Number(viewInvoice.transport_expense) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>(-) Transport Expense (મજૂરી / ટ્રાન્સપોર્ટ)</span><span>{formatCurrency(viewInvoice.transport_expense)}</span>
                    </div>
                  )}
                  {Number(viewInvoice.other_expense) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>(-) Other Expense (અન્ય ખર્ચ)</span><span>{formatCurrency(viewInvoice.other_expense)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>(-) Commission (કમિશન) ({viewInvoice.commission_percent}%)</span>
                    <span>{formatCurrency(viewInvoice.commission_amount)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-lg border-t-[3px] border-black pt-2 mt-2">
                    <span>Final Payable (ચૂકવવાપાત્ર રકમ)</span><span>{formatCurrency(viewInvoice.final_payable)}</span>
                  </div>
                </div>

                {/* Signature */}
                <div className="border-t-2 border-black px-4 py-3 flex justify-between">
                  <div className="text-center w-[40%]"><div className="border-t border-black mt-10 pt-1 text-[10px]">Receiver's Signature</div></div>
                  <div className="text-center w-[40%]"><div className="border-t border-black mt-10 pt-1 text-[10px]">Authorized Signature</div></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 px-4 pb-4">
                <button onClick={() => setViewInvoice(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium text-sm">
                  Close
                </button>
                <button onClick={() => handlePrint(viewInvoice)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 font-medium text-sm flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => handleDownloadPDF(viewInvoice)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 font-medium text-sm flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

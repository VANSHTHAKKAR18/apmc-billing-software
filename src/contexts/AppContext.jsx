import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const api = window.electronAPI || createMockAPI();

function createMockAPI() {
  let parties = [], invoices = [], pinHash = null;
  let headers = [
    { id:1, name_en:'M/S. MEHULKUMAR NATVARLAL', name_gu:'મેસર્સ મેહુલકુમાર નટવરલાલ', address:'APMC Market Yard, Unjha, Gujarat', mobile:'9876543210', is_default:1 },
    { id:2, name_en:'M/S. NATVARLAL HARILAL', name_gu:'મેસર્સ નટવરલાલ હરિલાલ', address:'APMC Market Yard, Unjha, Gujarat', mobile:'9876543211', is_default:0 },
    { id:3, name_en:'APMC UNJHA', name_gu:'એ.પી.એમ.સી. ઊંઝા', address:'APMC Market Yard, Unjha, Gujarat - 384170', mobile:'9876543212', is_default:0 },
  ];
  let settings = { theme:'dark', language:'en', default_commission:'5', auto_lock_minutes:'15' };
  let invSeq = 0;

  // Helper: get active invoices
  const active = () => invoices.filter(i => i.status === 'active');

  return {
    minimize:()=>{}, maximize:()=>{}, close:()=>{}, isMaximized:async()=>false,
    checkPinExists: async()=> !!pinHash,
    setPin: async(h)=>{ pinHash=h; return true; },
    getPin: async()=> pinHash,
    getHeaders: async()=> headers,
    getDefaultHeader: async()=> headers.find(h=>h.is_default),
    setDefaultHeader: async(id)=>{ headers.forEach(h=>h.is_default=h.id===id?1:0); return true; },

    // Parties
    getParties: async()=> parties.filter(p=>p.status!=='deleted'),
    getPartyById: async(id)=> parties.find(p=>p.id===Number(id)),
    createParty: async(p)=>{ const np={id:Date.now(),...p,status:'active',created_at:new Date().toISOString()}; parties.push(np); return np; },
    updateParty: async(id,p)=>{ const i=parties.findIndex(x=>x.id===Number(id)); if(i>=0) parties[i]={...parties[i],...p}; return true; },
    deleteParty: async(id)=>{ const i=parties.findIndex(x=>x.id===Number(id)); if(i>=0) parties[i].status='deleted'; return true; },
    getPartyStats: async(id)=>{
      const pi = active().filter(i=>i.party_id===Number(id));
      return {
        total_invoices: pi.length,
        total_sales: pi.reduce((s,i)=>s+i.total_amount,0),
        total_commission: pi.reduce((s,i)=>s+i.commission_amount,0),
        total_payable: pi.reduce((s,i)=>s+i.final_payable,0),
      };
    },

    // Invoices
    getInvoices: async(filters)=> {
      let list = active();
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(i => (i.invoice_number||'').toLowerCase().includes(q) || (i.party_name||'').toLowerCase().includes(q));
      }
      if (filters?.partyId) list = list.filter(i => i.party_id === Number(filters.partyId));
      if (filters?.startDate) list = list.filter(i => (i.date||'').split('T')[0] >= filters.startDate);
      if (filters?.endDate) list = list.filter(i => (i.date||'').split('T')[0] <= filters.endDate);
      return list;
    },
    getInvoiceById: async(id)=> invoices.find(i=>i.id===Number(id)),

    createInvoice: async(inv)=>{
      invSeq++;
      const d = new Date();
      const n = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(invSeq).padStart(4,'0')}`;
      const party = parties.find(p=>p.id===Number(inv.party_id));
      const header = headers.find(h=>h.id===Number(inv.bill_header_id));
      const ni = {
        id: Date.now(), invoice_number: n, ...inv, status:'active',
        date: d.toISOString(), created_at: d.toISOString(),
        party_name: party?.name || '', party_mobile: party?.mobile || '', party_address: party?.address || '',
        header_name_en: header?.name_en || '', header_name_gu: header?.name_gu || '',
        header_address: header?.address || '', header_mobile: header?.mobile || '',
        items: inv.items || null,
      };
      invoices.unshift(ni);
      return { id:ni.id, invoice_number:n };
    },

    updateInvoice: async(id,inv)=>{
      const i = invoices.findIndex(x=>x.id===Number(id));
      if(i>=0) {
        const party = parties.find(p=>p.id===Number(inv.party_id));
        const header = headers.find(h=>h.id===Number(inv.bill_header_id));
        invoices[i] = {
          ...invoices[i], ...inv,
          party_name: party?.name || invoices[i].party_name,
          party_mobile: party?.mobile || '', party_address: party?.address || '',
          header_name_en: header?.name_en || invoices[i].header_name_en,
          header_name_gu: header?.name_gu || invoices[i].header_name_gu,
          header_address: header?.address || '', header_mobile: header?.mobile || '',
          items: inv.items || invoices[i].items || null,
        };
      }
      return true;
    },

    deleteInvoice: async(id)=>{ const i=invoices.findIndex(x=>x.id===Number(id)); if(i>=0) invoices[i].status='deleted'; return true; },

    duplicateInvoice: async(id)=>{
      const orig = invoices.find(x=>x.id===Number(id));
      if(!orig) return null;
      invSeq++;
      const n = `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(invSeq).padStart(4,'0')}`;
      const ni = { ...orig, id:Date.now(), invoice_number:n, date:new Date().toISOString(), created_at:new Date().toISOString() };
      invoices.unshift(ni);
      return { id:ni.id, invoice_number:n };
    },

    // *** FIXED: Dashboard now computes real stats from invoices ***
    getDashboardStats: async()=>{
      const all = active();
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0,7) + '-01';
      const yearStart = today.substring(0,4) + '-01-01';

      const todayInvs = all.filter(i => (i.date||'').split('T')[0] === today);
      const monthInvs = all.filter(i => (i.date||'').split('T')[0] >= monthStart);
      const yearInvs = all.filter(i => (i.date||'').split('T')[0] >= yearStart);

      const sum = (arr, key) => arr.reduce((s, i) => s + (Number(i[key]) || 0), 0);

      const totalCommission = sum(all, 'commission_amount');
      const totalExpenses = all.reduce((s, i) => s + (Number(i.transport_expense)||0) + (Number(i.other_expense)||0), 0);

      // Group by party for top parties
      const partyMap = {};
      all.forEach(i => {
        const name = i.party_name || 'Walk-in';
        if (!partyMap[name]) partyMap[name] = { name, id: i.party_id, total_commission:0, total_sales:0, invoice_count:0 };
        partyMap[name].total_commission += Number(i.commission_amount)||0;
        partyMap[name].total_sales += Number(i.total_amount)||0;
        partyMap[name].invoice_count++;
      });
      const topParties = Object.values(partyMap).sort((a,b) => b.total_commission - a.total_commission).slice(0,5);

      // Highest commission bills
      const highestBills = [...all].sort((a,b) => (b.commission_amount||0) - (a.commission_amount||0)).slice(0,5).map(b => ({
        invoice_number: b.invoice_number, commission_amount: b.commission_amount,
        total_amount: b.total_amount, date: b.date, party_name: b.party_name || 'Walk-in',
      }));

      // Monthly trend
      const monthMap = {};
      all.forEach(i => {
        const m = (i.date||'').substring(0,7);
        if (!monthMap[m]) monthMap[m] = { month:m, commission:0, sales:0, expenses:0, invoices:0 };
        monthMap[m].commission += Number(i.commission_amount)||0;
        monthMap[m].sales += Number(i.total_amount)||0;
        monthMap[m].expenses += (Number(i.transport_expense)||0) + (Number(i.other_expense)||0);
        monthMap[m].invoices++;
      });
      const monthlyTrend = Object.values(monthMap).sort((a,b) => a.month.localeCompare(b.month)).slice(-12);

      return {
        total: {
          total_commission: totalCommission,
          total_sales: sum(all, 'total_amount'),
          total_revenue: sum(all, 'final_payable'),
          total_expenses: totalExpenses,
          total_invoices: all.length,
        },
        today: { commission: sum(todayInvs, 'commission_amount'), sales: sum(todayInvs, 'total_amount'), invoices: todayInvs.length },
        month: { commission: sum(monthInvs, 'commission_amount'), sales: sum(monthInvs, 'total_amount'), invoices: monthInvs.length },
        year: { commission: sum(yearInvs, 'commission_amount'), sales: sum(yearInvs, 'total_amount'), invoices: yearInvs.length },
        topParties,
        highestBills,
        monthlyTrend,
        recentBills: all.slice(0, 10),
        netProfit: totalCommission - totalExpenses,
      };
    },

    // *** FIXED: Reports now compute from real data ***
    generateReport: async(filters)=>{
      let list = active();
      if (filters?.partyId) list = list.filter(i => i.party_id === Number(filters.partyId));
      if (filters?.startDate) list = list.filter(i => (i.date||'').split('T')[0] >= filters.startDate);
      if (filters?.endDate) list = list.filter(i => (i.date||'').split('T')[0] <= filters.endDate);
      if (filters?.product) list = list.filter(i => i.product === filters.product);
      const summary = {
        total_sales: list.reduce((s,i) => s + (Number(i.total_amount)||0), 0),
        total_commission: list.reduce((s,i) => s + (Number(i.commission_amount)||0), 0),
        total_transport: list.reduce((s,i) => s + (Number(i.transport_expense)||0), 0),
        total_other_expense: list.reduce((s,i) => s + (Number(i.other_expense)||0), 0),
        total_payable: list.reduce((s,i) => s + (Number(i.final_payable)||0), 0),
        total_weight: list.reduce((s,i) => s + (Number(i.weight_kg)||0), 0),
        invoice_count: list.length,
      };
      return { invoices: list, summary };
    },

    getSetting: async(k)=> settings[k]||null,
    setSetting: async(k,v)=>{ settings[k]=v; return true; },
    createBackup: async()=> { alert('Backup created (mock mode)'); return 'backup.db'; },
    restoreBackup: async()=> true,
    autoBackup: async()=> 'auto.db',
    deleteAllData: async()=>{ invoices=[]; parties=[]; return true; },
    printInvoice: async()=> true,
    savePdf: async()=> null, // handled in component
  };
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [parties, setParties] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const lockTimer = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      resetLockTimer();
      window.addEventListener('mousemove', resetLockTimer);
      window.addEventListener('keydown', resetLockTimer);
      return () => {
        window.removeEventListener('mousemove', resetLockTimer);
        window.removeEventListener('keydown', resetLockTimer);
        if (lockTimer.current) clearTimeout(lockTimer.current);
      };
    }
  }, [isAuthenticated]);

  const resetLockTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setIsAuthenticated(false);
    }, 15 * 60 * 1000);
  }, []);

  const loadSettings = async () => {
    try {
      const t = await api.getSetting('theme');
      const l = await api.getSetting('language');
      if (t) setTheme(t);
      if (l) setLanguage(l);
    } catch(e) { console.error(e); }
  };

  const loadParties = async () => {
    const p = await api.getParties();
    setParties(p || []);
  };

  const loadHeaders = async () => {
    const h = await api.getHeaders();
    setHeaders(h || []);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await api.setSetting('theme', newTheme);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'gu' : 'en';
    setLanguage(newLang);
    await api.setSetting('language', newLang);
  };

  const value = {
    api, isAuthenticated, setIsAuthenticated, theme, setTheme, toggleTheme,
    language, setLanguage, toggleLanguage, parties, setParties, loadParties,
    headers, setHeaders, loadHeaders, currentPage, setCurrentPage,
    selectedInvoice, setSelectedInvoice, selectedParty, setSelectedParty,
    editingInvoice, setEditingInvoice,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

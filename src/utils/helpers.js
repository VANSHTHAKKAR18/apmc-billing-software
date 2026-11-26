export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatWeight(kg) {
  if (!kg) return '0 KG';
  return Number(kg).toLocaleString('en-IN') + ' KG';
}

export function calculateInvoice(weight, rate, transportExp, otherExp, commissionPercent) {
  const w = parseFloat(weight) || 0;
  const r = parseFloat(rate) || 0;
  const te = parseFloat(transportExp) || 0;
  const oe = parseFloat(otherExp) || 0;
  const cp = parseFloat(commissionPercent) || 0;
  const totalAmount = w * r;
  const commissionAmount = (totalAmount * cp) / 100;
  const totalExpenses = te + oe;
  const finalPayable = totalAmount - te - oe - commissionAmount;
  return { totalAmount, commissionAmount, totalExpenses, finalPayable };
}

// Multi-item bill calculator
export function calculateMultiItemInvoice(items, transportExp, otherExp, commissionPercent) {
  const te = parseFloat(transportExp) || 0;
  const oe = parseFloat(otherExp) || 0;
  const cp = parseFloat(commissionPercent) || 0;

  const itemCalcs = (items || []).map(item => {
    const w = parseFloat(item.weight_kg) || 0;
    const r = parseFloat(item.rate) || 0;
    const amount = w * r;
    return { ...item, weight_kg: w, rate: r, amount };
  });

  const totalWeight = itemCalcs.reduce((s, i) => s + i.weight_kg, 0);
  const totalAmount = itemCalcs.reduce((s, i) => s + i.amount, 0);
  const commissionAmount = (totalAmount * cp) / 100;
  // Final Payable = Sale Amount - Transport - Other Expense - Commission
  const finalPayable = totalAmount - te - oe - commissionAmount;

  return { items: itemCalcs, totalWeight, totalAmount, commissionAmount, totalExpenses: te + oe, finalPayable };
}

export const LABELS = {
  en: {
    dashboard: 'Dashboard', newBill: 'New Bill', invoices: 'Invoices', parties: 'Parties',
    reports: 'Reports', settings: 'Settings', totalCommission: 'Total Commission',
    todayCommission: "Today's Commission", monthlyCommission: 'Monthly Commission',
    yearlyCommission: 'Yearly Commission', totalSales: 'Total Sales', totalRevenue: 'Total Revenue',
    netProfit: 'Net Profit', product: 'Product', weight: 'Weight (KG)', rate: 'Rate (₹)',
    totalAmount: 'Total Amount', transportExpense: 'Transport Expense', otherExpense: 'Other Expense',
    commissionPercent: 'Commission %', commissionAmount: 'Commission Amount',
    finalPayable: 'Final Payable', partyName: 'Party Name', mobile: 'Mobile', address: 'Address',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', print: 'Print',
    download: 'Download PDF', duplicate: 'Duplicate', search: 'Search...', filter: 'Filter',
    billHeader: 'Bill Header', selectParty: 'Select Party', addParty: 'Add New Party',
    jeera: 'Jeera', invoice: 'Bill', recentBills: 'Recent Bills',
    topParties: 'Top Parties by Commission', highestBills: 'Highest Commission Bills',
    pendingPayments: 'Pending Payments', backup: 'Backup', restore: 'Restore',
    deleteAll: 'Delete All Data', changePin: 'Change PIN', theme: 'Theme',
    language: 'Language', darkMode: 'Dark Mode', lightMode: 'Light Mode',
  },
  gu: {
    dashboard: 'ડેશબોર્ડ', newBill: 'નવું બિલ', invoices: 'બિલો', parties: 'પાર્ટીઓ',
    reports: 'રિપોર્ટ', settings: 'સેટિંગ્સ', totalCommission: 'કુલ કમિશન',
    todayCommission: 'આજનું કમિશન', monthlyCommission: 'માસિક કમિશન',
    yearlyCommission: 'વાર્ષિક કમિશન', totalSales: 'કુલ વેચાણ', totalRevenue: 'કુલ આવક',
    netProfit: 'ચોખ્ખો નફો', product: 'પ્રોડક્ટ', weight: 'વજન (KG)', rate: 'ભાવ (₹)',
    totalAmount: 'કુલ રકમ', transportExpense: 'ટ્રાન્સપોર્ટ ખર્ચ', otherExpense: 'અન્ય ખર્ચ',
    commissionPercent: 'કમિશન %', commissionAmount: 'કમિશન રકમ',
    finalPayable: 'ચૂકવવાપાત્ર રકમ', partyName: 'પાર્ટીનું નામ', mobile: 'મોબાઇલ',
    address: 'સરનામું', save: 'સેવ', cancel: 'રદ', delete: 'ડિલીટ', edit: 'એડિટ',
    print: 'પ્રિન્ટ', download: 'PDF ડાઉનલોડ', duplicate: 'ડુપ્લિકેટ', search: 'શોધો...',
    filter: 'ફિલ્ટર', billHeader: 'બિલ હેડર', selectParty: 'પાર્ટી પસંદ કરો',
    addParty: 'નવી પાર્ટી ઉમેરો', jeera: 'જીરું', invoice: 'બિલ', recentBills: 'તાજેતરના બિલો',
    topParties: 'ટોચની પાર્ટીઓ', highestBills: 'સૌથી વધુ કમિશન બિલ',
    pendingPayments: 'બાકી ચૂકવણી', backup: 'બેકઅપ', restore: 'રિસ્ટોર',
    deleteAll: 'બધો ડેટા ડિલીટ', changePin: 'PIN બદલો', theme: 'થીમ',
    language: 'ભાષા', darkMode: 'ડાર્ક મોડ', lightMode: 'લાઇટ મોડ',
  },
};

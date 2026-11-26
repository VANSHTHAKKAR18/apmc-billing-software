import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { LABELS } from '../utils/helpers';
import {
  Settings as SettingsIcon, Sun, Moon, Globe, Lock, Database,
  Download, Upload, Trash2, AlertTriangle, Shield, Check, X,
  Palette, Key, HardDrive, RefreshCcw
} from 'lucide-react';
import bcryptjs from 'bcryptjs';

export default function Settings() {
  const { api, language, theme, toggleTheme, toggleLanguage } = useApp();
  const labels = LABELS[language] || LABELS.en;
  const [defaultCommission, setDefaultCommission] = useState('5');
  const [showChangePin, setShowChangePin] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [pinForm, setPinForm] = useState({ current: '', new: '', confirm: '' });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const dc = await api.getSetting('default_commission');
    if (dc) setDefaultCommission(dc);
  };

  const saveCommission = async () => {
    await api.setSetting('default_commission', defaultCommission);
  };

  const handleChangePin = async () => {
    setPinError('');
    if (pinForm.new.length < 4 || pinForm.new.length > 6) {
      setPinError('New PIN must be 4-6 digits'); return;
    }
    if (pinForm.new !== pinForm.confirm) {
      setPinError('PINs do not match'); return;
    }
    const storedHash = await api.getPin();
    if (storedHash && !bcryptjs.compareSync(pinForm.current, storedHash)) {
      setPinError('Current PIN is incorrect'); return;
    }
    const hash = bcryptjs.hashSync(pinForm.new, 10);
    await api.setPin(hash);
    setPinSuccess(true);
    setTimeout(() => {
      setShowChangePin(false);
      setPinSuccess(false);
      setPinForm({ current: '', new: '', confirm: '' });
    }, 1500);
  };

  const handleDeleteAll = async () => {
    setDeleteError('');
    const storedHash = await api.getPin();
    if (storedHash && !bcryptjs.compareSync(deletePin, storedHash)) {
      setDeleteError('Admin PIN is incorrect'); return;
    }
    await api.deleteAllData();
    setDeleteConfirm(true);
    setTimeout(() => {
      setShowDeleteAll(false);
      setDeleteConfirm(false);
      setDeletePin('');
    }, 2000);
  };

  const handleBackup = async () => {
    setBackupStatus('creating');
    const path = await api.createBackup();
    setBackupStatus(path ? 'success' : 'cancelled');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleAutoBackup = async () => {
    setBackupStatus('creating');
    await api.autoBackup();
    setBackupStatus('auto-success');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleRestore = async () => {
    await api.restoreBackup();
  };

  const Section = ({ icon: Icon, title, children, iconColor = 'text-primary-400' }) => (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} /> {title}
      </h3>
      {children}
    </div>
  );

  return (
    <motion.div className="h-full overflow-y-auto p-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary-400" /> {labels.settings}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        {/* Appearance */}
        <Section icon={Palette} title="Appearance" iconColor="text-purple-400">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated/50">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                <div>
                  <p className="text-sm font-medium">{labels.theme}</p>
                  <p className="text-xs text-surface-500">{theme === 'dark' ? labels.darkMode : labels.lightMode}</p>
                </div>
              </div>
              <button onClick={toggleTheme} className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-primary-600' : 'bg-surface-400'}`}>
                <motion.div animate={{ x: theme === 'dark' ? 24 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated/50">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">{labels.language}</p>
                  <p className="text-xs text-surface-500">{language === 'en' ? 'English' : 'ગુજરાતી'}</p>
                </div>
              </div>
              <button onClick={toggleLanguage} className="btn-ghost text-sm">{language === 'en' ? 'ગુજરાતી' : 'English'}</button>
            </div>
          </div>
        </Section>

        {/* Commission */}
        <Section icon={Shield} title="Default Commission" iconColor="text-gold-400">
          <div className="flex items-center gap-3">
            <input type="number" value={defaultCommission} onChange={e => setDefaultCommission(e.target.value)}
              className="input-field w-24 text-center" min="0" max="100" step="0.5" />
            <span className="text-surface-400">%</span>
            <button onClick={saveCommission} className="btn-primary text-sm py-2">Save</button>
          </div>
          <p className="text-xs text-surface-500 mt-2">Default commission for new bills</p>
        </Section>

        {/* Security */}
        <Section icon={Lock} title="Security" iconColor="text-red-400">
          <button onClick={() => setShowChangePin(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-sm font-medium">{labels.changePin}</p>
                <p className="text-xs text-surface-500">Update your login PIN</p>
              </div>
            </div>
            <span className="text-surface-500">›</span>
          </button>
        </Section>

        {/* Backup */}
        <Section icon={HardDrive} title="Backup & Restore" iconColor="text-blue-400">
          <div className="space-y-3">
            <button onClick={handleBackup}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors text-sm">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Manual Backup</span>
              {backupStatus === 'success' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
            </button>
            <button onClick={handleAutoBackup}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors text-sm">
              <RefreshCcw className="w-5 h-5 text-blue-400" />
              <span>Auto Backup</span>
              {backupStatus === 'auto-success' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
            </button>
            <button onClick={handleRestore}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-elevated/50 hover:bg-dark-hover transition-colors text-sm">
              <Upload className="w-5 h-5 text-amber-400" />
              <span>Restore Backup</span>
            </button>
          </div>
        </Section>

        {/* Danger Zone */}
        <div className="lg:col-span-2 glass-card p-6 border-red-800/30">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <button onClick={() => setShowDeleteAll(true)}
            className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-800/20 hover:bg-red-500/10 transition-colors text-sm text-red-400 w-full">
            <Trash2 className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">{labels.deleteAll}</p>
              <p className="text-xs text-red-400/60">Permanently removes all bills, parties, and data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {showChangePin && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowChangePin(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm">
              <h3 className="font-semibold mb-4">{labels.changePin}</h3>
              {pinSuccess ? (
                <div className="text-center py-4">
                  <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400">PIN Updated!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="password" value={pinForm.current} onChange={e => setPinForm({...pinForm, current:e.target.value.replace(/\D/g,'').slice(0,6)})}
                    placeholder="Current PIN" className="input-field text-center tracking-widest" maxLength={6} />
                  <input type="password" value={pinForm.new} onChange={e => setPinForm({...pinForm, new:e.target.value.replace(/\D/g,'').slice(0,6)})}
                    placeholder="New PIN (4-6 digits)" className="input-field text-center tracking-widest" maxLength={6} />
                  <input type="password" value={pinForm.confirm} onChange={e => setPinForm({...pinForm, confirm:e.target.value.replace(/\D/g,'').slice(0,6)})}
                    placeholder="Confirm New PIN" className="input-field text-center tracking-widest" maxLength={6} />
                  {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setShowChangePin(false)} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleChangePin} className="btn-primary flex-1">Update</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All Modal */}
      <AnimatePresence>
        {showDeleteAll && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeleteAll(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
              onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm border-red-800/30">
              {deleteConfirm ? (
                <div className="text-center py-4">
                  <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400">All data deleted successfully</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-400">Delete All Data</h3>
                      <p className="text-xs text-surface-400">This cannot be undone!</p>
                    </div>
                  </div>
                  <div className="bg-red-500/5 border border-red-800/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-red-400">This will permanently delete:</p>
                    <ul className="text-xs text-red-400/70 mt-1 space-y-0.5 list-disc list-inside">
                      <li>All bills & invoices</li>
                      <li>All party records</li>
                      <li>Commission history</li>
                      <li>All saved data</li>
                    </ul>
                  </div>
                  <input type="password" value={deletePin} onChange={e => setDeletePin(e.target.value.replace(/\D/g,'').slice(0,6))}
                    placeholder="Enter Admin PIN" className="input-field text-center tracking-widest mb-3" maxLength={6} />
                  {deleteError && <p className="text-red-400 text-sm text-center mb-3">{deleteError}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setShowDeleteAll(false); setDeletePin(''); setDeleteError(''); }} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleDeleteAll} disabled={deletePin.length < 4}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50">
                      Delete Everything
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

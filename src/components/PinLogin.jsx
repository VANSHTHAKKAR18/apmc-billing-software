import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import bcryptjs from 'bcryptjs';

export default function PinLogin() {
  const { api, setIsAuthenticated } = useApp();
  const [pin, setPin] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('check'); // check, login, setup, confirm
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    checkPin();
  }, []);

  useEffect(() => {
    if (locked && lockTime > 0) {
      const t = setInterval(() => setLockTime(p => { if(p <= 1) { setLocked(false); setAttempts(0); return 0; } return p-1; }), 1000);
      return () => clearInterval(t);
    }
  }, [locked, lockTime]);

  useEffect(() => { inputRef.current?.focus(); }, [step]);

  const checkPin = async () => {
    const exists = await api.checkPinExists();
    setStep(exists ? 'login' : 'setup');
  };

  const handleLogin = async () => {
    if (locked) return;
    if (pin.length < 4) { setError('Enter at least 4 digits'); return; }
    const storedHash = await api.getPin();
    const valid = bcryptjs.compareSync(pin, storedHash);
    if (valid) {
      setIsAuthenticated(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Wrong PIN! ${5 - newAttempts} attempts left`);
      setPin('');
      if (newAttempts >= 5) {
        setLocked(true);
        setLockTime(30);
        setError('Too many attempts. Locked for 30 seconds.');
      }
    }
  };

  const handleSetup = () => {
    if (pin.length < 4 || pin.length > 6) { setError('PIN must be 4-6 digits'); return; }
    setConfirmPin('');
    setStep('confirm');
    setError('');
  };

  const handleConfirm = async () => {
    if (confirmPin !== pin) { setError('PINs do not match!'); setConfirmPin(''); return; }
    const hash = bcryptjs.hashSync(pin, 10);
    await api.setPin(hash);
    setIsAuthenticated(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 'login') handleLogin();
      else if (step === 'setup') handleSetup();
      else if (step === 'confirm') handleConfirm();
    }
  };

  const handlePinInput = (value, setter) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setter(clean);
    setError('');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center gradient-mesh relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.1,0.2,0.1] }} transition={{ duration:8, repeat:Infinity }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-700/20 blur-3xl" />
        <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.1,0.15,0.1] }} transition={{ duration:10, repeat:Infinity }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-400/15 blur-3xl" />
      </div>

      <motion.div initial={{ opacity:0, y:30, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.6, ease:'easeOut' }}
        className="glass-card p-10 w-full max-w-md relative z-10">
        
        {/* Logo */}
        <motion.div className="flex flex-col items-center mb-8"
          initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">APMC Unjha</h1>
          <p className="text-sm text-surface-500 mt-1 font-gujarati">એ.પી.એમ.સી. ઊંઝા</p>
          <p className="text-xs text-surface-600 mt-2">Commission Billing Software</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div className="text-center mb-6">
                <Lock className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                <p className="text-surface-400 text-sm">Enter your PIN to unlock</p>
              </div>
              <div className="relative mb-4">
                <input ref={inputRef} type={showPin ? 'text' : 'password'} value={pin}
                  onChange={e => handlePinInput(e.target.value, setPin)} onKeyDown={handleKeyDown}
                  placeholder="Enter PIN" disabled={locked} maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] pr-12" autoFocus />
                <button onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white">
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* PIN dots */}
              <div className="flex justify-center gap-3 mb-6">
                {[0,1,2,3,4,5].map(i => (
                  <motion.div key={i} animate={{ scale: pin.length > i ? 1 : 0.6, backgroundColor: pin.length > i ? '#D4A843' : '#252838' }}
                    className="w-3 h-3 rounded-full" />
                ))}
              </div>
              <button onClick={handleLogin} disabled={locked || pin.length < 4} className="btn-primary w-full disabled:opacity-50">
                {locked ? `Locked (${lockTime}s)` : 'Unlock'}
              </button>
            </motion.div>
          )}

          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div className="text-center mb-6">
                <p className="text-gold-400 font-semibold mb-1">First Time Setup</p>
                <p className="text-surface-400 text-sm">Create a 4-6 digit PIN</p>
              </div>
              <input ref={inputRef} type={showPin ? 'text' : 'password'} value={pin}
                onChange={e => handlePinInput(e.target.value, setPin)} onKeyDown={handleKeyDown}
                placeholder="Create PIN" maxLength={6}
                className="input-field text-center text-2xl tracking-[0.5em] mb-4" autoFocus />
              <button onClick={handleSetup} disabled={pin.length < 4} className="btn-gold w-full disabled:opacity-50">
                Continue
              </button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
              <div className="text-center mb-6">
                <p className="text-gold-400 font-semibold mb-1">Confirm PIN</p>
                <p className="text-surface-400 text-sm">Re-enter your PIN</p>
              </div>
              <input ref={inputRef} type="password" value={confirmPin}
                onChange={e => handlePinInput(e.target.value, setConfirmPin)} onKeyDown={handleKeyDown}
                placeholder="Confirm PIN" maxLength={6}
                className="input-field text-center text-2xl tracking-[0.5em] mb-4" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setStep('setup'); setPin(''); setError(''); }} className="btn-ghost flex-1">Back</button>
                <button onClick={handleConfirm} disabled={confirmPin.length < 4} className="btn-primary flex-1 disabled:opacity-50">
                  Set PIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

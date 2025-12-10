
import React, { useState, useEffect, useRef } from 'react';
import { Language, RemoteStorageProvider, LoginMethod } from '../types';
import { t } from '../services/i18n';

interface LoginDialogProps {
  provider: RemoteStorageProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ provider, isOpen, onClose, onSuccess, lang }) => {
  const [method, setMethod] = useState<LoginMethod>('PASSWORD');
  const [loading, setLoading] = useState(false);
  
  // Common Form State
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Form State
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // SMB Form State
  const [smbHost, setSmbHost] = useState('192.168.1.100');
  const [smbShare, setSmbShare] = useState('Music');

  // QR Code State
  const [qrUrl, setQrUrl] = useState('');
  const [qrStatus, setQrStatus] = useState<'waiting' | 'scanned' | 'success'>('waiting');
  const timerRef = useRef<any>(null);

  // Reset state when provider changes
  useEffect(() => {
      if (provider && isOpen) {
          setMethod(provider.supportedMethods[0]);
          setAccount('');
          setPassword('');
          setPhone('');
          setCode('');
          setQrUrl('');
          setQrStatus('waiting');
          setCountdown(0);
          
          // Optional: Reset SMB defaults or keep them for better UX in mock
          if (!provider.supportedMethods.includes('SMB')) {
             // Reset if not supported to avoid confusion if we switch providers contextually (though usually dialog closes)
          }

          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, [provider, isOpen]);

  // Countdown Logic
  useEffect(() => {
      let interval: any;
      if (countdown > 0) {
          interval = setInterval(() => {
              setCountdown(prev => prev - 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [countdown]);

  // QR Code Polling Logic
  useEffect(() => {
      if (isOpen && method === 'QRCODE' && provider?.getLoginQRCode) {
          setLoading(true);
          provider.getLoginQRCode().then(url => {
              setQrUrl(url);
              setLoading(false);
              
              // Start Polling
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = setInterval(async () => {
                  if (provider.checkQRCodeStatus) {
                      const success = await provider.checkQRCodeStatus();
                      if (success) {
                          setQrStatus('success');
                          clearInterval(timerRef.current);
                          setTimeout(() => {
                              onSuccess();
                              onClose();
                          }, 1000);
                      }
                  }
              }, 1500);
          });
      }

      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [isOpen, method, provider]);


  if (!isOpen || !provider) return null;

  const handleSendCode = async () => {
      if (!phone) {
          alert('Please enter phone number');
          return;
      }
      if (provider.sendPhoneVerification) {
          await provider.sendPhoneVerification(phone);
          setCountdown(60); // 60s countdown
          // Mock alert
          alert(`[Mock] Verification code sent to ${phone}: 123456`);
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let success = false;
      if (method === 'PASSWORD') {
        success = await provider.loginWithPassword(account, password);
      } else if (method === 'PHONE' && provider.loginWithPhone) {
        success = await provider.loginWithPhone(phone, code);
        if(!success) alert('Invalid code (Try 123456)');
      } else if (method === 'SMB' && provider.loginWithSMB) {
          success = await provider.loginWithSMB(smbHost, smbShare, account, password);
      }
      
      if (success) {
        onSuccess();
        onClose();
      } else {
          alert('Login failed. Please check your credentials.');
      }
    } catch (err) {
      alert('Login failed due to an error.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMethodLabel = (m: LoginMethod) => {
      switch(m) {
          case 'PASSWORD': return t('cloud.password', lang);
          case 'PHONE': return t('cloud.phone', lang);
          case 'QRCODE': return t('cloud.scanQR', lang);
          case 'SMB': return 'SMB';
          default: return m;
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-800 w-[420px] rounded-lg shadow-xl border border-zinc-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center">
             <span className="mr-2 text-2xl">{provider.icon}</span> 
             {t('cloud.loginTitle', lang)} - {provider.name}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        {/* Dynamic Tabs */}
        {provider.supportedMethods.length > 1 && (
            <div className="flex border-b border-zinc-700 mb-6">
            {provider.supportedMethods.map(m => (
                <button 
                    key={m}
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${method === m ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                    onClick={() => setMethod(m)}
                >
                    {getMethodLabel(m)}
                </button>
            ))}
            </div>
        )}

        {/* Content */}
        {method === 'QRCODE' ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                {loading ? (
                    <div className="w-40 h-40 bg-zinc-700 animate-pulse rounded flex items-center justify-center text-zinc-500">Loading QR...</div>
                ) : (
                    <div className="bg-white p-2 rounded-lg relative">
                        <img src={qrUrl} alt="Login QR" className={`w-40 h-40 ${qrStatus === 'success' ? 'opacity-20' : ''}`} />
                        {qrStatus === 'success' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-green-600 font-bold text-xl">✓ Scanned</span>
                             </div>
                        )}
                    </div>
                )}
                
                <div className="text-center">
                    {qrStatus === 'success' ? (
                        <p className="text-green-500 font-bold text-lg">{t('cloud.qrSuccess', lang)}</p>
                    ) : (
                        <>
                            <p className="text-white font-medium">{t('cloud.scanTip', lang)}</p>
                            <p className="text-zinc-500 text-sm mt-1">{t('cloud.qrWaiting', lang)}</p>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <form onSubmit={handleLogin} className="space-y-4">
            
            {/* SMB Fields */}
            {method === 'SMB' && (
                <>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400 ml-1">{t('cloud.smbHost', lang)}</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 192.168.1.100" 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                            value={smbHost}
                            onChange={e => setSmbHost(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400 ml-1">{t('cloud.smbShare', lang)}</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Music" 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                            value={smbShare}
                            onChange={e => setSmbShare(e.target.value)}
                            required
                        />
                    </div>
                </>
            )}

            {/* Account/Password Fields (Shared by PASSWORD and SMB) */}
            {(method === 'PASSWORD' || method === 'SMB') && (
                <>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400 ml-1">{t('cloud.account', lang)}</label>
                    <input 
                        type="text" 
                        placeholder={t('cloud.account', lang)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                        value={account}
                        onChange={e => setAccount(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400 ml-1">{t('cloud.password', lang)}</label>
                    <input 
                        type="password" 
                        placeholder={t('cloud.password', lang)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                </>
            )}

            {/* Phone Fields */}
            {method === 'PHONE' && (
                <>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400 ml-1">{t('cloud.phone', lang)}</label>
                    <input 
                        type="tel" 
                        placeholder={t('cloud.phone', lang)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        placeholder={t('cloud.code', lang)} 
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-500 outline-none placeholder-zinc-500 text-sm"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        required
                    />
                    <button 
                        type="button" 
                        onClick={handleSendCode}
                        disabled={countdown > 0 || !phone}
                        className={`w-28 text-xs rounded transition ${countdown > 0 || !phone ? 'bg-zinc-700 text-zinc-500' : 'bg-red-600 text-white hover:bg-red-500'}`}
                    >
                        {countdown > 0 ? `${countdown}s` : 'Get Code'}
                    </button>
                </div>
                </>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition disabled:opacity-50 mt-4"
            >
                {loading ? 'Logging in...' : t('common.login', lang)}
            </button>
            </form>
        )}
      </div>
    </div>
  );
};

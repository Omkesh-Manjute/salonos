import { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Smartphone, ArrowRight, ChevronLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { isSupabaseConfigured, supabase, signInWithEmail } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const DEMO_OTP = '123456';

export default function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const confirmationResultRef = useRef(null);
  const hasActiveVerificationSession = Boolean(confirmationResult);
  const demoMode = !isSupabaseConfigured;

  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile, startDemoSession } = useAuth();
  const from = location.state?.from?.pathname || '/app';

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  }

  function setConfirmationSession(nextConfirmationResult) {
    setConfirmationResult(nextConfirmationResult);
    confirmationResultRef.current = nextConfirmationResult;
    window.confirmationResult = nextConfirmationResult;
  }

  function resetVerificationSession() {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    setConfirmationSession(null);
    setOtp('');
  }

  function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!demoMode && hasActiveVerificationSession) {
      setError('An OTP session is already active. Verify that OTP or use "Resend OTP" to start a new session.');
      setStep('otp');
      return;
    }

    setLoading(true);
    try {
      if (demoMode) {
        // Demo: skip real SMS
        setStep('otp');
        setLoading(false);
        return;
      }
      
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = formatPhone(phone);
      
      const sessionResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationSession(sessionResult);
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP via Firebase.');
      // remove recaptcha instance if exists so we can safely rebuild it
      resetVerificationSession();
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (loading) return;
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setStep('phone');
      return;
    }

    resetVerificationSession();
    setError('');

    if (demoMode) {
      setStep('otp');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = formatPhone(phone);
      const sessionResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationSession(sessionResult);
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to resend OTP via Firebase.');
      resetVerificationSession();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    if (!demoMode && !hasActiveVerificationSession) {
      setError('OTP session not found. Please resend OTP to continue.');
      return;
    }

    setLoading(true);
    try {
      if (demoMode) {
        if (otp !== DEMO_OTP) throw new Error('Invalid OTP. Use 123456 for demo.');
        await startDemoSession('customer', {
          name: 'Priya Customer',
          phone: formatPhone(phone),
        });
        navigate(from, { replace: true });
        return;
      }
      
      const result = await confirmationResultRef.current.confirm(otp);
      const firebaseUser = result.user;
      
      const phoneNum = firebaseUser.phoneNumber;
      const proxyEmail = `${phoneNum.replace('+', '')}@firebase.salonos.in`;
      const proxyPassword = firebaseUser.uid; // Use UID as password for better consistency
      
      let { error: supaError } = await signInWithEmail(proxyEmail, proxyPassword);
      
      if (supaError && (supaError.status === 400 || supaError.message.includes('Invalid login credentials'))) {
        // Attempt to create or sync the bridged user
        const { error: rpcError } = await supabase.rpc('create_firebase_user_if_not_exists', {
          target_email: proxyEmail,
          target_phone: phoneNum,
          target_password: proxyPassword
        });
        
        if (rpcError) {
          console.error('Bridge RPC Error:', rpcError);
          throw new Error('[S1] Database connection error. Please try again.');
        }
        
        const retry = await supabase.auth.signInWithPassword({ email: proxyEmail, password: proxyPassword });
        if (retry.error) throw new Error(`[S2] ${retry.error.message}`);
      } else if (supaError) {
        throw supaError;
      }

      await refreshProfile();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Verification Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('[F1] Incorrect OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('[F2] OTP expired. Please request a new one.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('[F3] Too many attempts. Please wait 5 minutes.');
      } else if (err.message && err.message.includes('confirmationResult')) {
        setError('[F4] Session lost. Please request a new OTP.');
      } else {
        setError(err.message ? `[E] ${err.message}` : '[E] Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG blobs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-gold-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to SalonOS
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SalonOS</h1>
              <p className="text-xs text-gray-500">Customer Login</p>
            </div>
          </div>

          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
                <p className="text-gray-400 text-sm">Enter your mobile number to get an OTP.</p>
              </div>

              {/* Demo badge */}
              {demoMode && (
                <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 mb-5">
                  <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
                  <span className="text-xs text-gold-300">Demo Mode — OTP will be <strong>123456</strong></span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Mobile Number</label>
                  <div className="flex items-center glass border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500/60 transition-colors">
                    <div className="flex items-center gap-2 px-4 py-3 border-r border-white/10">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
                <p className="text-gray-400 text-sm">
                  OTP sent to <span className="text-white">+91 {phone}</span>
                  {demoMode && <span className="text-gold-400 ml-1">(Demo: use 123456)</span>}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="_ _ _ _ _ _"
                    className="w-full glass border border-white/10 rounded-xl px-4 py-4 text-white text-2xl tracking-[0.5em] text-center placeholder-gray-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-center text-sm text-brand-400 hover:text-brand-300 transition-colors py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetVerificationSession();
                    setStep('phone');
                    setError('');
                  }}
                  className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
                >
                  Change number
                </button>
              </form>
            </>
          )}

          {/* Other login options */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-center">
            <p className="text-xs text-gray-500 mb-3">Are you a salon owner or admin?</p>
            <div className="flex gap-2">
              <Link to="/login/customer-email" className="flex-1 text-center text-xs bg-white/5 border border-white/10 hover:border-brand-500/40 text-gray-300 hover:text-white rounded-lg py-2.5 transition-all">
                Login with Email
              </Link>
              <Link to="/login/owner" className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">
                Owner Login
              </Link>
              <Link to="/login/admin" className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}

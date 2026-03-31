import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Smartphone, ArrowRight, ChevronLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { sendFirebaseOtp, verifyFirebaseOtp, signInWithGoogle } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const DEMO_OTP = '123456';

export default function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const demoMode = false; // Demo disabled for customers

  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile, startDemoSession } = useAuth();
  const from = location.state?.from?.pathname || '/app';

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await signInWithGoogle();
      if (authError) throw authError;
      await refreshProfile();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { data, error: otpError } = await sendFirebaseOtp(formatted, 'recaptcha-container');
      
      if (otpError) throw otpError;
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const { data: user, error: verifyError } = await verifyFirebaseOtp(otp);
      if (verifyError) throw verifyError;
      
      // Wait for AuthContext to pick up the Firebase user and sync with Supabase
      await refreshProfile();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* reCAPTCHA anchor */}
      <div id="recaptcha-container"></div>

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

              {/* No demo badge for customers */}

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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#12121a] px-2 text-gray-400">Or continue with</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:bg-white/5 text-white py-3 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
                <p className="text-gray-400 text-sm">
                  OTP sent to <span className="text-white">+91 {phone}</span>
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
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
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
    </div>
  );
}

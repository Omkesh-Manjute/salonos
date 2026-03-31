import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, Lock, Mail, Phone, RefreshCw, Scissors, ShieldCheck, Smartphone } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { signInWithEmailFirebase, signInWithGoogle, sendFirebaseOtp, verifyFirebaseOtp } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const ROLE_CONTENT = {
  owner: {
    title: 'Owner Login',
    welcome: 'Run your salon smarter.',
    subtitle: 'Access bookings, staff, CRM, reports, and live queue management.',
    cta: 'Login to Dashboard',
    accent: 'text-brand-400',
    redirect: '/dashboard',
    other: '/login/admin',
    otherLabel: 'Admin Login',
  },
  admin: {
    title: 'Admin Login',
    welcome: 'Manage the SalonOS platform.',
    subtitle: 'Review tenants, monitor security, and control platform settings.',
    cta: 'Login to Admin Panel',
    accent: 'text-red-400',
    demoEmail: 'admin@demo.salonos.in',
    demoPassword: 'admin123',
    demoPhone: '+918888888888',
    redirect: '/admin',
    other: '/login/owner',
    otherLabel: 'Owner Login',
  },
};

export default function RoleLogin({ role = 'owner' }) {
  const content = useMemo(() => ROLE_CONTENT[role] || ROLE_CONTENT.owner, [role]);
  const [method, setMethod] = useState('choice'); // 'choice' | 'email' | 'phone'
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [email, setEmail] = useState(role === 'admin' ? content.demoEmail : '');
  const [password, setPassword] = useState(role === 'admin' ? content.demoPassword : '');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const demoMode = !isSupabaseConfigured;

  const { startDemoSession, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || content.redirect;

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await signInWithGoogle();
      if (authError) throw authError;
      await refreshProfile(role);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(event) {
    if (event) event.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      
      // Demo bypass for phone (Admin only)
      if (role === 'admin' && formatted === (content.demoPhone || '+918888888888')) {
        setStep('otp');
        setLoading(false);
        return;
      }

      const { error: otpError } = await sendFirebaseOtp(formatted, 'recaptcha-container');
      if (otpError) throw otpError;
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(event) {
    if (event) event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'admin' && (demoMode || phone.includes('88888'))) {
        if (otp !== '123456') throw new Error('Invalid OTP for demo.');
        await startDemoSession(role, { phone });
        navigate(from, { replace: true });
        return;
      }

      const { error: verifyError } = await verifyFirebaseOtp(otp);
      if (verifyError) throw verifyError;
      await refreshProfile(role);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (method === 'phone') {
      if (step === 'input') return handlePhoneSubmit();
      return handleOtpVerify();
    }

    setError('');
    setLoading(true);

    try {
      // Demo bypass for email (Admin only)
      if (role === 'admin' && email === content.demoEmail && password === content.demoPassword) {
        await startDemoSession(role, { name: 'Super Admin', email });
        navigate(from, { replace: true });
        return;
      }

      const { data, error: authError } = await signInWithEmailFirebase(email, password);
      if (authError) throw authError;

      // Ensure profile is loaded before redirecting
      await refreshProfile(role);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      <div className="absolute top-1/4 -left-32 w-[420px] h-[420px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[380px] h-[380px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to SalonOS
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role === 'admin' ? 'from-red-600 to-orange-400' : 'from-brand-500 to-gold-400'} flex items-center justify-center`}>
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SalonOS</h1>
              <p className="text-xs text-gray-500">{content.title}</p>
            </div>
          </div>

          {method === 'choice' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{content.welcome}</h2>
                <p className="text-gray-400 text-sm">Select your login method.</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:bg-white/5 text-white py-3.5 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => setMethod('phone')}
                  className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:bg-white/5 text-white py-3.5 rounded-xl text-sm font-medium transition-all"
                >
                  <Smartphone className="w-5 h-5 text-brand-400" />
                  Continue with Mobile
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#12121a] px-2 text-gray-500">Or use email</span></div>
                </div>

                <button
                  onClick={() => setMethod('email')}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm py-2 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Sign in with Email
                </button>
              </div>
            </>
          ) : method === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{step === 'input' ? 'Mobile Login' : 'Verify OTP'}</h2>
                <p className="text-gray-400 text-sm">{step === 'input' ? 'Get an OTP on your mobile' : `Enter OTP sent to +91 ${phone}`}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 'input' ? (
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
                ) : (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">6-Digit OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="_ _ _ _ _ _"
                      className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-white text-xl tracking-[0.5em] text-center placeholder-gray-700 focus:outline-none focus:border-brand-500/60 transition-colors"
                      autoFocus
                    />
                  </div>
                )}

                {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{step === 'input' ? 'Send OTP' : 'Verify & Continue'} <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button type="button" onClick={() => { setMethod('choice'); setStep('input'); setError(''); }} className="w-full text-center text-xs text-gray-500 hover:text-white py-2">Change method</button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Email Login</h2>
                <p className="text-gray-400 text-sm">Enter your credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                  <div className="flex items-center glass border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500/60 transition-colors">
                    <div className="px-4 py-3 border-r border-white/10"><Mail className="w-4 h-4 text-gray-400" /></div>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                      placeholder="name@company.com"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                  <div className="flex items-center glass border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500/60 transition-colors">
                    <div className="px-4 py-3 border-r border-white/10"><Lock className="w-4 h-4 text-gray-400" /></div>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{content.cta} <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button type="button" onClick={() => { setMethod('choice'); setError(''); }} className="w-full text-center text-xs text-gray-500 hover:text-white py-2">Change method</button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-center">
            <p className="text-xs text-gray-500 mb-3">Need a different portal?</p>
            <div className="flex gap-2">
              <Link to="/login/customer" className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">Customer Login</Link>
              <Link to={content.other} className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">{content.otherLabel}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, Lock, Mail, RefreshCw, Scissors, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, signInWithEmail } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ROLE_CONTENT = {
  owner: {
    title: 'Owner Login',
    welcome: 'Run your salon smarter.',
    subtitle: 'Access bookings, staff, CRM, reports, and live queue management.',
    cta: 'Login to Dashboard',
    accent: 'text-brand-400',
    demoEmail: 'owner@demo.salonos.in',
    demoPassword: 'owner123',
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
    redirect: '/admin',
    other: '/login/owner',
    otherLabel: 'Owner Login',
  },
};

export default function RoleLogin({ role = 'owner' }) {
  const content = useMemo(() => ROLE_CONTENT[role] || ROLE_CONTENT.owner, [role]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const demoMode = !isSupabaseConfigured;

  const { startDemoSession, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || content.redirect;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (demoMode) {
        await startDemoSession(role, {
          name: role === 'owner' ? 'Aurangzeb Alamgir' : 'Super Admin',
          email,
        });
        navigate(from, { replace: true });
        return;
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              role: role,
              name: email.split('@')[0],
            }
          }
        });
        if (signUpError) throw signUpError;
        setSuccess('Account created! Please check your email for confirmation, then login.');
        setIsSignUp(false);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        await refreshProfile();
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-[420px] h-[420px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[380px] h-[380px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to SalonOS
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SalonOS</h1>
              <p className="text-xs text-gray-500">{content.title}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">{content.welcome}</h2>
            <p className="text-gray-400 text-sm">{content.subtitle}</p>
          </div>

          {demoMode && (
            <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 mb-5">
              <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
              <span className="text-xs text-gold-300">Demo Mode — use the prefilled credentials to continue.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
              <div className="flex items-center glass border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500/60 transition-colors">
                <div className="px-4 py-3 border-r border-white/10">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
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
                <div className="px-4 py-3 border-r border-white/10">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
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
            {success && <p className="text-green-400 text-xs bg-green-500/10 rounded-lg p-3">{success}</p>}

            <div className={`flex gap-3 pt-2 ${role === 'admin' ? '' : 'sm:flex-row flex-col'}`}>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{isSignUp ? 'Create Owner Account' : content.cta} <ArrowRight className="w-4 h-4" /></>}
              </button>
              
              {role === 'owner' && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-xl py-3.5 transition-all"
                >
                  {isSignUp ? 'Back to Login' : 'Register Salon'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-center">
            <p className="text-xs text-gray-500 mb-3">Need a different portal?</p>
            <div className="flex gap-2">
              <Link to="/login/customer" className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">
                Customer Login
              </Link>
              <Link to={content.other} className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-lg py-2.5 transition-all">
                {content.otherLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

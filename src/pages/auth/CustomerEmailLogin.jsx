import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Mail, Lock, ArrowRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { supabase, signInWithEmail, signUpWithEmail } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CustomerEmailLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const from = location.state?.from?.pathname || '/app';

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user: authUser }, error: loginError } = await signInWithEmail(email, password);
      
      if (loginError) throw loginError;
      refreshProfile(); // Trigger but don't await to avoid UI hang
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await signUpWithEmail(email, password, {
        role: 'customer',
        name: email.split('@')[0],
      });
      if (signUpError) throw signUpError;
      setSuccess('Account created! Please check your email for confirmation.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-gold-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/login/customer" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Phone Login
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SalonOS</h1>
              <p className="text-xs text-gray-500">Customer Email Access</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-gray-400 text-sm">Login with your email and password.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address</label>
              <div className="flex items-center glass border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500/60 transition-colors">
                <div className="px-4 py-3 border-r border-white/10">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                  required
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
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}
            {success && <p className="text-green-400 text-xs bg-green-500/10 rounded-lg p-3">{success}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all glow disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 text-center text-xs glass border border-white/10 hover:border-brand-500/40 text-gray-400 hover:text-white rounded-xl py-3.5 transition-all"
              >
                Sign Up
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <Link to="/login/customer" className="text-sm text-brand-400 hover:text-brand-300 font-medium">
               Use Phone Login instead
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scissors, RefreshCw, MapPin, Star, Users, ArrowRight } from 'lucide-react';
import { getSalonBySlug, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SalonEntry() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSalon() {
      if (!slug) { setError('Invalid salon link.'); setLoading(false); return; }
      if (!isSupabaseConfigured) {
        // Demo mode: just save a fake salon_id
        localStorage.setItem('salon_id', 'demo-salon');
        localStorage.setItem('salon_name', 'Demo Salon');
        localStorage.setItem('salon_slug', slug);
        setSalon({ id: 'demo-salon', name: 'Demo Salon', slug });
        setLoading(false);
        return;
      }
      const { data, error: err } = await getSalonBySlug(slug);
      if (err || !data) {
        setError(`Salon "${slug}" not found. Please check the link or QR code.`);
        setLoading(false);
        return;
      }
      // Save salon context to localStorage
      localStorage.setItem('salon_id', data.id);
      localStorage.setItem('salon_name', data.name);
      localStorage.setItem('salon_slug', data.slug);
      setSalon(data);
      setLoading(false);
    }
    fetchSalon();
  }, [slug]);

  function handleEnter() {
    if (!salon) return;
    if (user && profile?.role === 'customer') {
      navigate('/app', { replace: true });
    } else {
      navigate('/login/customer', { replace: true });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-gray-400 text-sm">Finding your salon…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Salon Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-brand-400 hover:text-brand-300 text-sm"
          >
            ← Back to SalonOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Salon Card */}
        <div className="glass rounded-3xl overflow-hidden border border-white/10">
          {/* Header gradient */}
          <div className="h-28 bg-gradient-to-br from-brand-700 via-brand-600 to-gold-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }}
            />
            <div className="absolute top-4 right-4">
              <span className="text-[11px] bg-white/20 backdrop-blur text-white px-2.5 py-1 rounded-full font-medium">
                ✓ Verified Salon
              </span>
            </div>
          </div>

          {/* Salon avatar */}
          <div className="px-6 -mt-8 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center shadow-xl mb-4 border-2 border-[#0a0a0f]">
              <Scissors className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">{salon.name}</h1>
            <p className="text-sm text-brand-400 font-mono mb-4">@{salon.slug}</p>

            <div className="flex items-center gap-4 mb-6 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-gold-400" />
                <span>4.9 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                <span>Expert Team</span>
              </div>
              {salon.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <span>{salon.city}</span>
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-4 border border-white/10 mb-6">
              <p className="text-sm text-gray-300 leading-relaxed">
                Welcome! Book appointments, join the live queue, and manage your visits — all in one place.
              </p>
            </div>

            <button
              id="salon-entry-btn"
              onClick={handleEnter}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/40"
            >
              {user && profile?.role === 'customer' ? 'Enter Salon' : 'Login & Book'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Powered by <span className="text-brand-400 font-medium">SalonOS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

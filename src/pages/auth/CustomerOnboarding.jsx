import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  User, 
  MapPin, 
  Search, 
  Check, 
  ArrowRight, 
  ChevronRight, 
  Building2, 
  QrCode,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 
  'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal'
].sort();

export default function CustomerOnboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Profile
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [city, setCity] = useState(profile?.city || '');
  
  // Step 2: Salon Selection
  const [salonCode, setSalonCode] = useState('');
  const [salonsInCity, setSalonsInCity] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);

  // Fetch salons when city changes or step 2 is reached
  useEffect(() => {
    if (step === 2 && city) {
      fetchSalonsInCity();
    }
  }, [step, city]);

  async function fetchSalonsInCity() {
    setSearching(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('salons')
        .select('*')
        .eq('city', city)
        .eq('status', 'active');
      
      if (fetchError) throw fetchError;
      setSalonsInCity(data || []);
    } catch (err) {
      console.error('Error fetching salons:', err);
    } finally {
      setSearching(false);
    }
  }

  async function handleManualCode() {
    if (!salonCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('salons')
        .select('*')
        .eq('slug', salonCode.toLowerCase().trim())
        .single();
      
      if (fetchError || !data) {
        throw new Error('Invalid Salon Code. Please check and try again.');
      }
      
      handleCompleteOnboarding(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteOnboarding(salon) {
    setLoading(true);
    setError('');
    try {
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          email,
          city,
          tenant_id: salon.tenant_id,
          salon_id: salon.id,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!name || !city) {
        setError('Please fill in all required fields.');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 -left-32 w-[420px] h-[420px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-[380px] h-[380px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-xl relative z-10">
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">SalonOS</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Welcome Home</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 w-6 rounded-full transition-all duration-500 ${step === s ? 'bg-brand-500 w-10' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Complete your profile</h2>
                <p className="text-gray-400">Tell us a bit about yourself to get started.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Full Name</label>
                    <div className="flex items-center glass border border-white/10 rounded-2xl p-4 focus-within:border-brand-500/50 transition-all group">
                      <User className="w-5 h-5 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 placeholder:text-gray-600"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">City</label>
                    <div className="flex items-center glass border border-white/10 rounded-2xl p-4 focus-within:border-brand-500/50 transition-all group">
                      <MapPin className="w-5 h-5 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                      <select 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 appearance-none cursor-pointer"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      >
                        <option value="" className="bg-[#1a1a1f] text-gray-400">Select City</option>
                        {INDIAN_CITIES.map(c => (
                          <option key={c} value={c} className="bg-[#1a1a1f] text-white">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email (Optional)</label>
                    <div className="flex items-center glass border border-white/5 opacity-80 rounded-2xl p-4 transition-all">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 placeholder:text-gray-700"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Phone Number</label>
                    <div className="flex items-center glass border border-white/5 opacity-60 rounded-2xl p-4 bg-white/5">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="ml-3 text-gray-400 flex-1">{profile?.phone || 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button 
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.02]"
              >
                Continue to Salon Selection <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Select your salon</h2>
                  <p className="text-gray-400">Choose your favorite salon in <span className="text-brand-400 font-bold">{city}</span></p>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest underline underline-offset-4"
                >
                  Change City
                </button>
              </div>

              {/* Manual Code Option */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-brand-500/5 blur-xl group-focus-within:bg-brand-500/15 transition-all" />
                  <div className="relative glass border border-brand-500/20 rounded-3xl p-6 transition-all group-focus-within:border-brand-500/40">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-brand-400" />
                      </div>
                      <h3 className="font-bold text-lg">Have a Salon Code?</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 flex items-center focus-within:border-brand-500/50 transition-all">
                        <input 
                          className="bg-transparent border-none focus:ring-0 text-white w-full py-3 placeholder:text-gray-700 font-mono tracking-widest text-lg"
                          placeholder="e.g. GLAM-CHANDIGARH"
                          value={salonCode}
                          onChange={(e) => setSalonCode(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleManualCode}
                        disabled={loading || !salonCode.trim()}
                        className="bg-brand-500 hover:bg-brand-400 disabled:bg-white/10 disabled:text-gray-600 px-6 rounded-2xl font-bold transition-all flex items-center justify-center"
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-[0.3em]">OR DISCOVER</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* List Option */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {searching ? (
                    <div className="py-12 text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
                      <p className="text-gray-500 text-sm">Searching for salons in your area...</p>
                    </div>
                  ) : salonsInCity.length > 0 ? (
                    salonsInCity.map((salon) => (
                      <button
                        key={salon.id}
                        onClick={() => handleCompleteOnboarding(salon)}
                        className="w-full text-left glass border border-white/5 hover:border-brand-500/30 p-5 rounded-2xl flex items-start gap-5 transition-all hover:bg-brand-500/5 group"
                      >
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-brand-500/20 shrink-0">
                          {salon.image_url ? (
                            <img src={salon.image_url} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 className="w-8 h-8 text-gray-600 group-hover:text-brand-400 transition-colors" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg mb-1 truncate text-gray-200 group-hover:text-white transition-colors">{salon.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" /> {salon.address || city}
                          </div>
                          <div className="inline-flex items-center gap-1 py-1 px-2 rounded-md bg-white/5 text-[10px] uppercase font-bold text-gray-500 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                            <Scissors className="w-2.5 h-2.5" /> Bookings Open
                          </div>
                        </div>
                        <div className="self-center">
                          <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center glass rounded-3xl border border-white/5 border-dashed">
                      <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No active salons found in {city}</p>
                      <p className="text-xs text-gray-500 mt-2">Try entering a Salon Code if you were invited manually.</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Users, 
  Check, 
  ChevronRight, 
  RefreshCw,
  Clock,
  DollarSign,
  Smartphone,
  QrCode
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const INDIAN_CITIES = [
  'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 
  'Kalyan-Dombivli', 'Vasai-Virar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 
  'Mira-Bhayandar', 'Jalgaon', 'Amravati', 'Nanded', 'Kolhapur', 
  'Sangli', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 
  'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Ambarnath', 
  'Bhusawal', 'Panvel', 'Badlapur', 'Beed', 'Gondia', 
  'Satara', 'Barshi', 'Yavatmal', 'Achalpur', 'Osmanabad', 
  'Nandurbar', 'Wardha', 'Udgir', 'Hinganghat', 'Delhi', 
  'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 
  'Jaipur', 'Lucknow', 'Kanpur', 'Indore', 'Bhopal'
].sort();

export default function OwnerOnboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Salon Details
  const [salonName, setSalonName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || '');
  const [salonCode, setSalonCode] = useState('');

  // Step 2: Services
  const [services, setServices] = useState([
    { name: 'Classic Haircut', duration: '30', price: '250' },
    { name: 'Beard Trim', duration: '20', price: '150' }
  ]);

  // Step 3: Staff
  const [staff, setStaff] = useState([
    { name: profile?.name || 'Owner', specialty: 'Expert Stylist' }
  ]);

  // Auto-generate salon code when salon name changes
  useEffect(() => {
    if (salonName && !salonCode) {
      const code = salonName.toUpperCase().replace(/\s+/g, '-').slice(0, 10) + '-' + Math.floor(1000 + Math.random() * 9000);
      setSalonCode(code);
    }
  }, [salonName]);

  const addService = () => setServices([...services, { name: '', duration: '30', price: '' }]);
  const removeService = (index) => setServices(services.filter((_, i) => i !== index));
  const updateService = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addStaff = () => setStaff([...staff, { name: '', specialty: '' }]);
  const removeStaff = (index) => setStaff(staff.filter((_, i) => i !== index));
  const updateStaff = (index, field, value) => {
    const newStaff = [...staff];
    newStaff[index][field] = value;
    setStaff(newStaff);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!salonName || !city || !address) {
        setError('Please fill in all required salon details.');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  async function handleCompleteSetup() {
    setLoading(true);
    setError('');
    try {
      // 1. Create the Salon
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({
          name: salonName,
          slug: salonCode.toLowerCase(),
          city,
          address,
          phone: ownerPhone,
          owner_user_id: user.id,
          owner_name: profile?.name || salonName,
          status: 'trial'
        })
        .select()
        .single();

      if (salonError) throw salonError;

      const tenantId = salon.tenant_id;
      const salonId = salon.id;

      // 2. Create Services
      if (services.length > 0) {
        const servicesData = services
          .filter(s => s.name && s.price)
          .map(s => ({
            tenant_id: tenantId,
            salon_id: salonId,
            name: s.name,
            duration_minutes: parseInt(s.duration),
            price: parseFloat(s.price),
            category: 'General'
          }));
        
        if (servicesData.length > 0) {
          const { error: sError } = await supabase.from('services').insert(servicesData);
          if (sError) throw sError;
        }
      }

      // 3. Create Subscription (Initial 14-day trial)
      const { error: subError } = await supabase.from('subscriptions').insert({
        tenant_id: tenantId,
        salon_id: salonId,
        plan: 'basic',
        status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (subError) throw subError;

      // 4. Update User Profile (Assign tenant and role)
      const { error: userError } = await supabase
        .from('users')
        .update({
          tenant_id: tenantId,
          salon_id: salonId,
          role: 'owner',
          city: city,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // 5. Add Staff (as individual user records if needed, or just metadata)
      // For now, we'll focus on the primary owner setup. 
      // Additional staff can be added via the dashboard later.

      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete salon setup.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG elements */}
      <div className="absolute top-1/4 -left-32 w-[450px] h-[450px] bg-brand-700/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">SalonOS</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Partner Portal</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step === s ? 'bg-brand-500 w-12' : step > s ? 'bg-brand-500/40' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Setup Your Salon</h2>
                <p className="text-gray-400">Tell us about your business to get started.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Salon Name</label>
                    <div className="flex items-center glass border border-white/10 rounded-2xl p-4 focus-within:border-brand-500/50 transition-all group">
                      <Building2 className="w-5 h-5 text-gray-500 group-focus-within:text-brand-400" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 placeholder:text-gray-600 font-medium"
                        placeholder="e.g. Royal Stylers"
                        value={salonName}
                        onChange={(e) => setSalonName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Salon Phone</label>
                    <div className="flex items-center glass border border-white/10 rounded-2xl p-4 focus-within:border-brand-500/50 transition-all group">
                      <Smartphone className="w-5 h-5 text-gray-500 group-focus-within:text-brand-400" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 placeholder:text-gray-600"
                        placeholder="e.g. 98765 43210"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
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

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Unique Salon Code</label>
                    <div className="flex items-center glass border border-brand-500/20 bg-brand-500/5 rounded-2xl p-4 transition-all group">
                      <QrCode className="w-5 h-5 text-brand-400" />
                      <input 
                        className="bg-transparent border-none focus:ring-0 ml-3 text-brand-300 flex-1 font-mono tracking-wider font-bold"
                        placeholder="GLAM-CITY-123"
                        value={salonCode}
                        onChange={(e) => setSalonCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 ml-1">Share this code with customers to join your salon.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Full Address</label>
                <div className="flex items-start glass border border-white/10 rounded-2xl p-4 focus-within:border-brand-500/50 transition-all group">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1 group-focus-within:text-brand-400" />
                  <textarea 
                    rows={2}
                    className="bg-transparent border-none focus:ring-0 ml-3 text-white flex-1 placeholder:text-gray-600 resize-none text-sm"
                    placeholder="Shop No, Street, Landmark..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <button 
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.01]"
              >
                Next: Setup Services <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Your Services</h2>
                  <p className="text-gray-400">Add services you offer at your salon.</p>
                </div>
                <button 
                  onClick={addService}
                  className="bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-brand-500/20"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {services.map((service, index) => (
                  <div key={index} className="glass border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Service Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/40"
                        placeholder="e.g. Mens Haircut"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Price (₹)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/40"
                          placeholder="250"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Mins</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/40"
                          placeholder="30"
                          value={service.duration}
                          onChange={(e) => updateService(index, 'duration', e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeService(index)}
                      className="mt-5 p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-5 rounded-2xl font-bold transition-all text-gray-400"
                >
                  Back
                </button>
                <button 
                  onClick={nextStep}
                  className="flex-[2] bg-brand-500 hover:bg-brand-400 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-500/20"
                >
                  Continue <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Staff & Team</h2>
                  <p className="text-gray-400">Add the experts working in your salon.</p>
                </div>
                <button 
                  onClick={addStaff}
                  className="bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-brand-500/20"
                >
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {staff.map((member, index) => (
                  <div key={index} className="glass border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shrink-0">
                      {member.name ? member.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Full Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/40"
                        placeholder="Stylist Name"
                        value={member.name}
                        onChange={(e) => updateStaff(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Specialty</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/40"
                        placeholder="e.g. Haircut Specialist"
                        value={member.specialty}
                        onChange={(e) => updateStaff(index, 'specialty', e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => removeStaff(index)}
                      className="mt-5 p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-5 rounded-2xl font-bold transition-all text-gray-400"
                >
                  Back
                </button>
                <button 
                  disabled={loading}
                  onClick={handleCompleteSetup}
                  className="flex-[2] bg-gradient-to-r from-emerald-600 to-brand-500 hover:from-emerald-500 hover:to-brand-400 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.01]"
                >
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6" /> Complete Setup</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

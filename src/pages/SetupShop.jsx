import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Plus, Trash2, Check, ChevronRight, Store, RefreshCw, QrCode, Copy, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured, addStaffMember } from '../lib/supabase';

const DEFAULT_SERVICES = ['Haircut', 'Shaving', 'Hair Color', 'Facial', 'Massage', 'Beard Trim', 'Hair Wash'];

function generateSlug(name) {
  const base = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 12);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
}

function StepDot({ step, current, label }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
        ${done ? 'bg-brand-500 text-white' : active ? 'bg-brand-600/30 border-2 border-brand-500 text-brand-300' : 'bg-white/5 border border-white/10 text-gray-500'}`}>
        {done ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-brand-300' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}

export default function SetupShop() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [createdSalon, setCreatedSalon] = useState(null);
  const [copied, setCopied] = useState(false);

  // Step 1
  const [salonName, setSalonName] = useState('');

  // Step 2 – Services
  const [services, setServices] = useState(
    DEFAULT_SERVICES.map((name) => ({ name, price: '', selected: false }))
  );
  const [customService, setCustomService] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Step 3 – Staff
  const [staffList, setStaffList] = useState([]);
  const [staffName, setStaffName] = useState('');
  const [staffSpecialty, setStaffSpecialty] = useState('');

  const toggleService = (idx) => {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s)));
  };
  const updatePrice = (idx, price) => {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, price } : s)));
  };
  const addCustomService = () => {
    if (!customService.trim()) return;
    setServices((prev) => [...prev, { name: customService.trim(), price: customPrice, selected: true }]);
    setCustomService('');
    setCustomPrice('');
  };
  const addStaff = () => {
    if (!staffName.trim()) return;
    setStaffList((prev) => [...prev, { name: staffName.trim(), specialty: staffSpecialty.trim() }]);
    setStaffName('');
    setStaffSpecialty('');
  };
  const removeStaff = (idx) => setStaffList((prev) => prev.filter((_, i) => i !== idx));

  const handleFinish = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const slug = generateSlug(salonName);
      let salon = null;

      if (isSupabaseConfigured) {
        const tenant_id = `tenant-${slug}`;
        // 1. Create salon
        const { data: salonData, error: salonErr } = await supabase
          .from('salons')
          .insert({ owner_id: user.uid, name: salonName, slug, tenant_id, is_setup: true })
          .select()
          .single();
        if (salonErr) throw salonErr;
        salon = salonData;

        // 2. Insert selected services
        const selectedServices = services.filter((s) => s.selected && s.name && s.price);
        if (selectedServices.length > 0) {
          await supabase.from('services').insert(
            selectedServices.map((s) => ({
              salon_id: salon.id,
              tenant_id: salon.tenant_id || tenant_id,
              name: s.name,
              price: Number(s.price),
              category: 'General',
              duration_minutes: 30,
              active: true,
            }))
          );
        }

        // 3. Insert staff
        for (const member of staffList) {
          await addStaffMember({ owner_id: user.uid, salon_id: salon.id, tenant_id: salon.tenant_id || tenant_id, name: member.name, specialty: member.specialty });
        }

        // 4. Update user profile
        await supabase.from('users').update({ salon_id: salon.id, tenant_id: salon.tenant_id || tenant_id, role: 'owner' }).eq('id', user.uid);

        // 5. Save salon to localStorage
        localStorage.setItem('owner_salon_id', salon.id);
        await refreshProfile('owner');
      } else {
        // Demo mode
        salon = { id: 'demo-salon', name: salonName, slug };
      }

      setCreatedSalon(salon);
      setDone(true);
    } catch (err) {
      console.error('Setup error:', err);
      alert('Setup failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [user, salonName, services, staffList, refreshProfile]);

  const salonUrl = createdSalon ? `${window.location.origin}/salon/${createdSalon.slug}` : '';
  const qrSrc = createdSalon ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(salonUrl)}&bgcolor=0a0a0f&color=a855f7&margin=12` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(salonUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (done && createdSalon) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass rounded-3xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Salon is Live! 🎉</h1>
          <p className="text-gray-400 text-sm mb-6">Share this link or QR code with your customers</p>

          {/* QR Code */}
          <div className="bg-white/5 rounded-2xl p-4 mb-4 inline-block">
            <img src={qrSrc} alt="Salon QR" className="w-40 h-40 rounded-xl" />
          </div>

          {/* Share link */}
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
            <span className="text-sm text-brand-300 font-mono truncate">{salonUrl}</span>
            <button onClick={copyLink} className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Go to Dashboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Setup Your Shop</h1>
          <p className="text-gray-400 text-sm">Let's get your salon ready in 3 steps</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StepDot step={1} current={step} label="Name" />
          <div className="flex-1 max-w-[60px] h-px bg-white/10" />
          <StepDot step={2} current={step} label="Services" />
          <div className="flex-1 max-w-[60px] h-px bg-white/10" />
          <StepDot step={3} current={step} label="Staff" />
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6">

          {/* ── Step 1: Salon Name ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">What's your salon called?</h2>
                <p className="text-sm text-gray-400">This is the name customers will see</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Salon Name</label>
                <input
                  id="salon-name-input"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="e.g. Sam's Creation"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60 text-sm transition-all"
                />
                {salonName && (
                  <p className="mt-2 text-xs text-gray-500">
                    Your salon link: <span className="text-brand-400 font-mono">/salon/{generateSlug(salonName)}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!salonName.trim()}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Next: Add Services <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Services ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">What services do you offer?</h2>
                <p className="text-sm text-gray-400">Select services and set prices</p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {services.map((svc, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${svc.selected ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
                    onClick={() => toggleService(idx)}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${svc.selected ? 'bg-brand-500 border-brand-500' : 'border-white/20'}`}>
                      {svc.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="flex-1 text-sm text-white">{svc.name}</span>
                    {svc.selected && (
                      <input
                        value={svc.price}
                        onChange={(e) => { e.stopPropagation(); updatePrice(idx, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="₹ Price"
                        className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-500/60 text-right"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Custom service */}
              <div className="flex gap-2">
                <input
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  placeholder="Custom service name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
                />
                <input
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="₹"
                  className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
                />
                <button onClick={addCustomService} className="p-2 rounded-xl bg-brand-600/30 border border-brand-500/30 hover:bg-brand-600/50 text-brand-300 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors border border-white/10">Back</button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  Next: Add Staff <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Staff ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Add your team</h2>
                <p className="text-sm text-gray-400">Customers will choose their preferred stylist</p>
              </div>

              {/* Staff list */}
              <div className="space-y-2">
                {staffList.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-sm font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{member.name}</div>
                      {member.specialty && <div className="text-xs text-gray-400">{member.specialty}</div>}
                    </div>
                    <button onClick={() => removeStaff(idx)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add staff form */}
              <div className="flex gap-2">
                <input
                  id="staff-name-input"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStaff()}
                  placeholder="Staff name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
                />
                <input
                  value={staffSpecialty}
                  onChange={(e) => setStaffSpecialty(e.target.value)}
                  placeholder="Specialty"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
                />
                <button onClick={addStaff} className="p-2 rounded-xl bg-brand-600/30 border border-brand-500/30 hover:bg-brand-600/50 text-brand-300 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors border border-white/10">Back</button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Complete Setup</>}
                </button>
              </div>
              <p className="text-center text-xs text-gray-500">You can always add more staff later from the dashboard</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

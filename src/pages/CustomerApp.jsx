import { useCallback, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Calendar, CheckCircle, ChevronLeft, Clock,
  Heart, Home, LogOut, RefreshCw, Scissors, Search, Star,
  Store, User, ArrowRight, Users, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCustomerAppData } from '../hooks/useSalonBackend';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'book', label: 'Book', icon: Calendar },
  { id: 'queue', label: 'Queue', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];

function StatusPill({ status }) {
  const map = {
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-brand-500/20 text-brand-300',
    pending: 'bg-yellow-500/20 text-yellow-400',
    waiting: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-emerald-500/20 text-emerald-400',
    next: 'bg-brand-500/20 text-brand-300',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-white/10 text-gray-300'}`}>{status?.replace('_', ' ')}</span>;
}

function EnterSalonScreen({ onEnter }) {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit() {
    if (!slug.trim()) return;
    setLoading(true); setError('');
    const result = await onEnter(slug.trim());
    if (result?.error) setError('Salon not found. Check the code and try again.');
    setLoading(false);
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-gold-500 flex items-center justify-center">
        <Store className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-white mb-1">Enter Salon Code</h2>
        <p className="text-sm text-gray-400">Type the salon's unique code to start booking</p>
      </div>
      <div className="w-full space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input id="salon-code-input" value={slug} onChange={e => setSlug(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. royalunisex1234"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60 font-mono" />
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <button onClick={handleSubmit} disabled={loading || !slug.trim()}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}Find Salon
        </button>
      </div>
    </div>
  );
}

// ─── Booking Flow ─────────────────────────────────────────────────────────

function BookingFlow({ services, staff, salon, preselectedStaff, favorites, toggleFavorite, onClose, onConfirm }) {
  const today = new Date().toISOString().split('T')[0];
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState({
    serviceId: '',
    staffName: preselectedStaff || '',
    bookingType: 'slot',
    date: today,
    slot: '',
  });
  const SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM'];
  const service = services.find(s => s.id === selected.serviceId);

  // Sort staff: favorites first, then available, then unavailable
  const sortedStaff = useMemo(() => {
    const fav = staff.filter(s => favorites.includes(s.id));
    const availNonFav = staff.filter(s => !favorites.includes(s.id) && s.available !== false);
    const unavail = staff.filter(s => !favorites.includes(s.id) && s.available === false);
    return [...fav, ...availNonFav, ...unavail];
  }, [staff, favorites]);

  async function handleConfirm() {
    if (!selected.serviceId || !selected.staffName) return;
    setSubmitting(true);
    let bookingTime;
    if (selected.bookingType === 'queue') {
      bookingTime = new Date().toISOString();
    } else {
      const [time, mer] = (selected.slot || '10:00 AM').split(' ');
      const [h, m] = time.split(':').map(Number);
      const totalH = mer === 'PM' && h !== 12 ? h + 12 : (mer === 'AM' && h === 12 ? 0 : h);
      const dt = new Date(selected.date);
      dt.setHours(totalH, m, 0, 0);
      bookingTime = dt.toISOString();
    }
    await onConfirm({ serviceId: selected.serviceId, staffName: selected.staffName, bookingType: selected.bookingType, bookingTime, paymentMethod: 'Cash at Salon' });
    setSubmitting(false);
    onClose(true);
  }

  // Dynamic steps: skip "Stylist" label when one is already pre-selected
  const displaySteps = preselectedStaff
    ? ['Service', 'Time', 'Confirm']
    : ['Service', 'Stylist', 'Time', 'Confirm'];
  // Map internal step index (0-3) to the display index for the shortened array
  const displayStepIndex = preselectedStaff
    ? (step === 0 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 0)
    : step;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <button onClick={() => {
          if (step === 0) onClose(false);
          else if (step === 2 && preselectedStaff) setStep(0); // skip back over stylist
          else setStep(step - 1);
        }} className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">New Booking</div>
          <div className="text-xs text-gray-400">{displaySteps[displayStepIndex]} — Step {displayStepIndex + 1} of {displaySteps.length}</div>
        </div>
      </div>
      {/* Step progress */}
      <div className="flex gap-1 px-4 pt-2 pb-1 shrink-0">
        {displaySteps.map((_, i) => <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= displayStepIndex ? 'bg-brand-500' : 'bg-white/10'}`} />)}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Step 0: Service */}
        {step === 0 && (services.length > 0 ? services.map(svc => (
          <button key={svc.id} id={`service-${svc.id}`} onClick={() => { setSelected(c => ({ ...c, serviceId: svc.id })); setStep(preselectedStaff ? 2 : 1); }}
            className={`w-full text-left rounded-2xl p-4 border transition-all ${selected.serviceId === svc.id ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/10 bg-white/3 hover:border-brand-500/30'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white text-sm">{svc.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{svc.category} · {svc.duration_minutes} mins</div>
              </div>
              <div className="text-brand-300 font-bold">₹{svc.price}</div>
            </div>
          </button>
        )) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            <Scissors className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            No services available yet
          </div>
        ))}

        {/* Step 1: Stylist */}
        {step === 1 && (sortedStaff.length > 0 ? sortedStaff.map(member => {
          const isFav = favorites.includes(member.id);
          const isUnavail = member.available === false;
          return (
            <button key={member.id} id={`staff-${member.id}`}
              onClick={() => { setSelected(c => ({ ...c, staffName: member.name })); setStep(2); }}
              className={`w-full text-left rounded-2xl p-4 border transition-all ${selected.staffName === member.name ? 'border-brand-500/60 bg-brand-500/10' : isUnavail ? 'border-white/5 bg-white/2 opacity-50' : 'border-white/10 bg-white/3 hover:border-brand-500/30'}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-2xl object-cover" />
                    : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg">{member.avatar}</div>
                  }
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0e0e1a] ${isUnavail ? 'bg-gray-500' : 'bg-emerald-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-white text-sm">{member.name}</div>
                    {isFav && <Heart className="w-3 h-3 fill-red-400 text-red-400" />}
                    {!isUnavail && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Available</span>}
                    {isUnavail && <span className="text-[10px] bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded-full">Busy</span>}
                  </div>
                  <div className="text-xs text-gray-400">{member.specialty}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>⭐ {member.rating}</span>
                    {member.experience && <span>{member.experience}</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(member.id); }}
                  className="p-2 rounded-xl hover:bg-white/10">
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-400 text-red-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </button>
          );
        }) : <div className="text-center py-10 text-gray-500 text-sm">No stylists available</div>)}

        {step === 1 && selected.staffName && (
          <button onClick={() => setStep(2)}
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            Continue with {selected.staffName}
          </button>
        )}

        {/* Step 2: Date + Time */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Show pre-selected stylist banner with option to change */}
            {preselectedStaff && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{preselectedStaff.charAt(0)}</div>
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Selected Stylist</div>
                  <div className="text-sm font-semibold text-white">{preselectedStaff}</div>
                </div>
                <button onClick={() => { setSelected(c => ({ ...c, staffName: '' })); setStep(1); }}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-colors">Change</button>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 mb-2 font-medium">Select Date</div>
              <input type="date" min={today} value={selected.date}
                onChange={e => setSelected(c => ({ ...c, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/60 [color-scheme:dark]" />
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-2 font-medium">Booking Type</div>
              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'slot', label: 'Book Slot', desc: 'Fixed time' }, { id: 'queue', label: 'Join Queue', desc: 'Live wait' }].map(t => (
                  <button key={t.id} onClick={() => setSelected(c => ({ ...c, bookingType: t.id }))}
                    className={`rounded-xl p-3 border text-left transition-all ${selected.bookingType === t.id ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/10 bg-white/3'}`}>
                    <div className="text-sm font-medium text-white">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {selected.bookingType === 'slot' && (
              <div>
                <div className="text-xs text-gray-400 mb-2 font-medium">Select Time</div>
                <div className="grid grid-cols-2 gap-2">
                  {SLOTS.map(slot => (
                    <button key={slot} onClick={() => { setSelected(c => ({ ...c, slot })); setTimeout(() => setStep(3), 300); }}
                      className={`rounded-xl py-2.5 text-sm border transition-all ${selected.slot === slot ? 'border-brand-500 bg-brand-500/10 text-white font-medium' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStep(3)}
              disabled={selected.bookingType === 'slot' && !selected.slot}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40">
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && service && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 space-y-3">
              <div className="text-sm font-semibold text-white mb-3">Booking Summary</div>
              {[
                ['Salon', salon?.name],
                ['Service', `${service.name} · ₹${service.price}`],
                ['Stylist', selected.staffName],
                ['Date', selected.bookingType === 'queue' ? 'Joining live queue now' : new Date(selected.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })],
                ['Time', selected.bookingType === 'queue' ? 'Queue position' : selected.slot],
                ['Duration', `${service.duration_minutes} mins`],
                ['Payment', 'Cash at Salon'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-400">{l}</span>
                  <span className="text-white font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <button id="confirm-booking-btn" onClick={handleConfirm} disabled={submitting}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Confirm Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home Tab ──────────────────────────────────────────────────────────────

function HomeTab({ profile, bookings, queue, services, staff, salon, favorites, toggleFavorite, openBooking, openBookingWithStaff, switchToQueue }) {
  const upcoming = bookings.find(b => b.status === 'confirmed' || b.status === 'pending');
  const myQueue = queue.find(q => q.user_id === profile?.id || q.customer_name === profile?.name);
  const favStaff = staff.filter(s => favorites.includes(s.id));

  return (
    <div className="p-4 space-y-4">
      {/* Welcome + upcoming */}
      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Welcome back ✨</div>
            <div className="text-base font-bold text-white">{profile?.name || 'Customer'}</div>
          </div>
          {salon && <span className="text-[11px] bg-brand-500/20 text-brand-300 px-2.5 py-1 rounded-full">{salon.name}</span>}
        </div>
        {upcoming ? (
          <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{upcoming.service_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{upcoming.staff_name} · {new Date(upcoming.booking_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <StatusPill status={upcoming.status} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-gray-400">No upcoming booking.</div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button id="book-now-btn" onClick={() => openBooking()}
          className="glass rounded-2xl p-4 border border-white/10 hover:border-brand-500/40 text-left transition-all active:scale-95">
          <Calendar className="w-5 h-5 text-brand-400 mb-2" />
          <div className="text-sm font-semibold text-white">Book Now</div>
          <div className="text-xs text-gray-400 mt-0.5">Reserve a slot</div>
        </button>
        <button id="queue-status-btn" onClick={switchToQueue}
          className="glass rounded-2xl p-4 border border-white/10 hover:border-gold-500/40 text-left transition-all active:scale-95">
          <Clock className="w-5 h-5 text-gold-400 mb-2" />
          <div className="text-sm font-semibold text-white">Queue Status</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {myQueue ? `#${myQueue.position} · ${myQueue.estimated_wait_minutes} min wait` : queue.length > 0 ? `${queue.length} in queue` : 'Queue empty'}
          </div>
        </button>
      </div>

      {/* Favorite stylists quick-book */}
      {favStaff.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-gold-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gold-400" />
            <div className="text-sm font-semibold text-white">Quick Book</div>
          </div>
          <div className="space-y-2">
            {favStaff.map(fav => (
              <button key={fav.id} id={`quick-book-${fav.id}`} onClick={() => openBookingWithStaff(fav.name)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {fav.avatar_url
                      ? <img src={fav.avatar_url} alt={fav.name} className="w-8 h-8 rounded-xl object-cover" />
                      : <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{fav.avatar}</div>
                    }
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e1a] ${fav.available !== false ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{fav.name}</div>
                    <div className="text-xs text-gray-400">{fav.specialty}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Stylists */}
      {staff.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Our Team</div>
            <div className="text-xs text-gray-500">{staff.filter(s => s.available !== false).length} available</div>
          </div>
          <div className="space-y-3">
            {staff.map(member => {
              const isFav = favorites.includes(member.id);
              const isAvail = member.available !== false;
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-2xl object-cover" />
                      : <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold">{member.avatar}</div>
                    }
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e1a] ${isAvail ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium text-white truncate">{member.name}</div>
                      {member.status === 'working' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Working Now
                        </div>
                      )}
                      {member.status === 'booked' && (
                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-tighter">
                          Booked
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{member.specialty} · ⭐ {member.rating}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button id={`fav-btn-${member.id}`} onClick={() => toggleFavorite(member.id)} className="p-1.5 rounded-lg hover:bg-white/10">
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-400 text-red-400' : 'text-gray-500'}`} />
                    </button>
                    <button onClick={() => openBookingWithStaff(member.name)} className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/10">
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="text-sm font-semibold text-white mb-3">Services & Prices</div>
          <div className="space-y-2">
            {services.map(svc => (
              <div key={svc.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-white">{svc.name}</div>
                  <div className="text-xs text-gray-500">{svc.duration_minutes} min · {svc.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-300">₹{svc.price}</span>
                  <button onClick={() => openBooking()} className="text-xs text-gray-400 hover:text-white">Book</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Queue Tab ─────────────────────────────────────────────────────────────

function QueueTab({ profile, queue, openBooking }) {
  const myQueue = queue.find(q => q.user_id === profile?.id || q.customer_name === profile?.name);
  return (
    <div className="p-4 space-y-4">
      {myQueue ? (
        <div className="glass rounded-2xl p-5 border border-brand-500/30">
          <div className="text-xs text-gray-400 mb-1 font-medium">Your Position</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-5xl font-bold text-white">#{myQueue.position}</div>
              <div className="text-sm text-gray-400 mt-1">{myQueue.service_name} · {myQueue.staff_name}</div>
              <div className="text-xs text-brand-400 mt-1">~{myQueue.estimated_wait_minutes} min wait</div>
            </div>
            <StatusPill status={myQueue.status} />
          </div>
          {myQueue.status === 'next' && (
            <div className="mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300 font-medium animate-pulse">
              🎉 You're next! Please head to the salon.
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-5 border border-white/10 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <div className="text-sm text-gray-400 mb-3">You haven't joined the queue yet</div>
          <button onClick={() => openBooking()} className="text-sm text-brand-400 border border-brand-500/30 px-4 py-2 rounded-xl hover:bg-brand-500/10">
            Join Queue
          </button>
        </div>
      )}

      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">Live Queue Board</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>
        </div>
        <div className="space-y-2">
          {queue.map(item => {
            const isMe = item.user_id === profile?.id || item.customer_name === profile?.name;
            return (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-white/3'}`}>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">{item.position}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium">{isMe ? `${item.customer_name} (You)` : item.customer_name}</div>
                  <div className="text-xs text-gray-400 truncate">{item.service_name} · {item.staff_name}</div>
                </div>
                <StatusPill status={item.status} />
              </div>
            );
          })}
          {queue.length === 0 && <div className="text-center py-4 text-sm text-gray-500">Queue is empty</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────

function ProfileTab({ profile, bookings, favorites, staff, onUpdate, uploadPhoto, refreshAuth }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    city: profile?.city || '',
    avatar_url: profile?.avatar_url || '',
  });

  const completed = bookings.filter(b => b.status === 'completed');
  const favStaff = staff.filter(s => favorites.includes(s.id));

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { data: url, error } = await uploadPhoto(file);
    if (!error && url) {
      setFormData(prev => ({ ...prev, avatar_url: url }));
    } else {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await onUpdate(formData);
    if (!error) {
      await refreshAuth();
      setIsEditing(false);
    }
    setSaving(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-500/10 overflow-hidden relative">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Profile" className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'opacity-100'}`} />
              ) : (
                (formData.name || 'C').charAt(0)
              )}
              {uploading && <div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-white" /></div>}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 rounded-xl border-2 border-[#0a0a0f] flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            {/* Tooltip on hover */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 px-2 py-1 bg-black text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 uppercase tracking-widest font-bold">Upload Photo</div>
          </div>
          
          {!isEditing ? (
            <>
              <div className="text-lg font-bold text-white">{profile?.name || 'Customer'}</div>
              <div className="text-xs text-gray-400 mt-0.5">{profile?.phone || profile?.email || 'SalonOS Member'}</div>
              {profile?.city && (
                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                  <Store className="w-3 h-3" /> {profile.city}
                </div>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-1.5 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                Edit Profile
              </button>
            </>
          ) : (
            <div className="w-full space-y-3 mt-2">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 ml-1 uppercase tracking-wider">Full Name</label>
                <input 
                  value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 ml-1 uppercase tracking-wider">Email Address</label>
                <input 
                  value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-gray-500 ml-1 uppercase tracking-wider">City</label>
                <input 
                  value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-gray-400">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-5">
          {[['Visits', completed.length], ['Bookings', bookings.length], ['Favorites', favStaff.length]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/5 p-2.5">
              <div className="text-lg font-bold text-white">{v}</div>
              <div className="text-[11px] text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Stylists */}
      {favStaff.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <div className="text-sm font-semibold text-white">Favorite Stylists</div>
          </div>
          <div className="space-y-2">
            {favStaff.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{s.avatar}</div>
                <div>
                  <div className="text-sm text-white font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.specialty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking history */}
      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="text-sm font-semibold text-white mb-3">Booking History</div>
        <div className="space-y-3">
          {bookings.slice(0, 5).map(b => (
            <div key={b.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{b.service_name}</div>
                <div className="text-xs text-gray-400">
                  {b.staff_name} · {new Date(b.booking_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-300">₹{b.total_amount}</span>
                <StatusPill status={b.status} />
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-sm text-gray-500">No bookings yet</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedStaff, setPreselectedStaff] = useState('');
  const [booked, setBooked] = useState(false);
  const navigate = useNavigate();
  const { profile, signOut, loading: authLoading } = useAuth();

  // Favorites: stored in localStorage keyed by salon
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fav_stylists') || '[]'); }
    catch { return []; }
  });
  const toggleFavorite = useCallback((staffId) => {
    setFavorites(prev => {
      const next = prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId];
      localStorage.setItem('fav_stylists', JSON.stringify(next));
      return next;
    });
  }, []);

  const { services, staff, bookings, queue, salon, createBooking, updateProfile, uploadPhoto, loading, error, mode, needsSalonEntry, enterSalonBySlug } = useCustomerAppData(profile);

  function openBooking() { setPreselectedStaff(''); setBookingOpen(true); setActiveTab('book'); }
  function openBookingWithStaff(staffName) { setPreselectedStaff(staffName); setBookingOpen(true); setActiveTab('book'); }
  function switchToQueue() { setBookingOpen(false); setActiveTab('queue'); }

  async function handleSignOut() { await signOut(); navigate('/login/customer', { replace: true }); }

  async function handleConfirmBooking(payload) {
    const result = await createBooking(payload);
    if (!result?.error) { setBooked(true); setTimeout(() => setBooked(false), 3000); }
  }

  const { refreshProfile } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-gray-400 text-sm">Loading SalonOS…</p>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Unable to load profile</p>
          <button onClick={() => navigate('/login/customer')} className="mt-4 text-brand-400 text-sm">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-3">
          <Link to="/" className="text-brand-400 text-sm flex items-center justify-center gap-1 hover:text-brand-300">
            <ChevronLeft className="w-4 h-4" /> Back to SalonOS
          </Link>
        </div>
        <div className="glass rounded-[2.5rem] overflow-hidden border border-white/10" style={{ height: '780px', display: 'flex', flexDirection: 'column' }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 bg-black/20 shrink-0">
            <span className="text-xs text-gray-300">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="w-20 h-5 bg-black rounded-full" />
            <div className="text-xs text-gray-300">●●●</div>
          </div>

          {/* App header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm leading-none">SalonOS</div>
              <div className="text-xs text-gray-400 truncate">{profile.name || 'Customer'}{salon ? ` · ${salon.name}` : ''}</div>
            </div>
            <div className="flex items-center gap-2">
              {booked && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">✓ Booked!</span>}
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">{mode === 'live' ? 'Live' : 'Demo'}</span>
              <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3" />Loading…</div>
            ) : needsSalonEntry ? (
              <EnterSalonScreen onEnter={enterSalonBySlug} />
            ) : (
              <>
                {error && <div className="mx-4 mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">{error}</div>}
                {bookingOpen
                  ? <BookingFlow key={`${preselectedStaff}-${bookingOpen}`} services={services} staff={staff} salon={salon}
                      preselectedStaff={preselectedStaff} favorites={favorites} toggleFavorite={toggleFavorite}
                      onClose={(didBook) => { setBookingOpen(false); setActiveTab('home'); }}
                      onConfirm={handleConfirmBooking} />
                  : activeTab === 'home' && <HomeTab profile={profile} bookings={bookings} queue={queue} services={services} staff={staff} salon={salon} favorites={favorites} toggleFavorite={toggleFavorite} openBooking={openBooking} openBookingWithStaff={openBookingWithStaff} switchToQueue={switchToQueue} />
                }
                {!bookingOpen && activeTab === 'queue' && <QueueTab profile={profile} queue={queue} openBooking={openBooking} />}
                {!bookingOpen && activeTab === 'profile' && <ProfileTab profile={profile} bookings={bookings} favorites={favorites} staff={staff} onUpdate={updateProfile} uploadPhoto={uploadPhoto} refreshAuth={refreshProfile} />}
              </>
            )}
          </div>

          {/* Bottom nav — ALWAYS VISIBLE (never hidden) */}
          {!needsSalonEntry && (
            <div className="border-t border-white/10 bg-black/20 shrink-0">
              <div className="flex">
                {TABS.map(tab => {
                  const isActive = tab.id === 'book' ? bookingOpen : (!bookingOpen && activeTab === tab.id);
                  return (
                    <button key={tab.id} id={`tab-${tab.id}`}
                      onClick={() => {
                        if (tab.id === 'book') { openBooking(); }
                        else { setBookingOpen(false); setActiveTab(tab.id); }
                      }}
                      className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}>
                      <tab.icon className="w-5 h-5" />
                      <span className="text-[10px]">{tab.label}</span>
                      {isActive && <div className="w-1 h-1 rounded-full bg-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

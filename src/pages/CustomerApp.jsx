import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Bell,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Heart,
  Home,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Scissors,
  Star,
  User,
  Zap,
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
  };
  return <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${map[status] || 'bg-white/10 text-gray-300'}`}>{status.replace('_', ' ')}</span>;
}

function BookingFlow({ services, staff, onClose, onConfirm, loading }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({ serviceId: '', staffName: '', bookingType: 'slot', slot: '' });
  const [submitting, setSubmitting] = useState(false);
  const slots = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:30 PM'];
  const service = services.find((item) => item.id === selected.serviceId);

  async function handleConfirm() {
    if (!selected.serviceId || !selected.staffName) return;
    setSubmitting(true);
    const now = new Date();
    const bookingTime = selected.bookingType === 'queue'
      ? now.toISOString()
      : new Date(`${now.toDateString()} ${selected.slot || '10:00 AM'}`).toISOString();
    await onConfirm({ ...selected, bookingTime, paymentMethod: 'UPI (GPay / PhonePe)' });
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => (step === 0 ? onClose() : setStep(step - 1))} className="p-1 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-semibold text-white">New Booking</h2>
          <p className="text-xs text-gray-400">Step {step + 1} of 4</p>
        </div>
      </div>

      <div className="flex gap-1 px-4 pt-3 pb-1">
        {[0, 1, 2, 3].map((item) => <div key={item} className={`flex-1 h-1 rounded-full ${item <= step ? 'bg-brand-500' : 'bg-white/10'}`} />)}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {step === 0 && services.map((item) => (
          <button key={item.id} onClick={() => { setSelected((current) => ({ ...current, serviceId: item.id })); setStep(1); }} className={`w-full text-left glass rounded-2xl p-4 border transition-all ${selected.serviceId === item.id ? 'border-brand-500/60' : 'border-white/10 hover:border-brand-500/30'}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-white">{item.name}</h3>
              <span className="text-brand-300 font-semibold">₹{item.price}</span>
            </div>
            <p className="text-sm text-gray-400">{item.description || item.category}</p>
            <p className="text-xs text-gray-500 mt-2">{item.duration_minutes} mins · {item.category}</p>
          </button>
        ))}

        {step === 1 && staff.map((item) => (
          <button key={item.id} onClick={() => { setSelected((current) => ({ ...current, staffName: item.name })); setStep(2); }} className={`w-full text-left glass rounded-2xl p-4 border transition-all ${selected.staffName === item.name ? 'border-brand-500/60' : 'border-white/10 hover:border-brand-500/30'}`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold">{item.avatar || item.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <span className="text-xs text-emerald-400">{item.available ? 'Available' : 'Busy'}</span>
                </div>
                <p className="text-sm text-gray-400">{item.specialty}</p>
                <p className="text-xs text-gray-500 mt-1">⭐ {item.rating} · {item.experience}</p>
              </div>
            </div>
          </button>
        ))}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'slot', title: 'Book Slot', desc: 'Arrive at an exact time' },
                { id: 'queue', title: 'Join Queue', desc: 'Get live wait updates' },
              ].map((item) => (
                <button key={item.id} onClick={() => setSelected((current) => ({ ...current, bookingType: item.id }))} className={`glass rounded-2xl p-4 border text-left ${selected.bookingType === item.id ? 'border-brand-500/60' : 'border-white/10'}`}>
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
            {selected.bookingType === 'slot' && (
              <div className="grid grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <button key={slot} onClick={() => setSelected((current) => ({ ...current, slot }))} className={`rounded-xl px-3 py-3 text-sm border ${selected.slot === slot ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-white/10 text-gray-300 bg-white/5'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(3)} disabled={selected.bookingType === 'slot' && !selected.slot} className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50">
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 border border-brand-500/20 space-y-3">
              {[
                ['Salon', "Sam's Creation"],
                ['Service', service?.name],
                ['Stylist', selected.staffName],
                ['Type', selected.bookingType === 'queue' ? 'Join live queue' : `Slot · ${selected.slot}`],
                ['Price', `₹${service?.price || 0}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={handleConfirm} disabled={submitting || loading} className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 glow disabled:opacity-60">
              {submitting || loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Confirm Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeTab({ profile, bookings, queue, services, staff, mode, openBooking }) {
  const upcoming = bookings.find((item) => item.status === 'confirmed');
  const queueEntry = queue.find((item) => item.user_id === profile?.id) || queue.find((item) => item.customer_name === profile?.name);

  return (
    <div className="p-4 space-y-4">
      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500">Welcome back</p>
            <h2 className="text-lg font-semibold text-white">{profile?.name || 'Customer'}</h2>
          </div>
          <span className={`text-[11px] px-2.5 py-1 rounded-full ${mode === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-300'}`}>{mode === 'live' ? 'Live backend' : 'Sample backend'}</span>
        </div>
        {upcoming ? (
          <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-4">
            <div className="text-sm text-white font-medium">Upcoming · {upcoming.service_name}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(upcoming.booking_time).toLocaleString()} · {upcoming.staff_name}</div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-gray-400">No upcoming booking. Book your next appointment in a few taps.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={openBooking} className="glass rounded-2xl p-4 border border-white/10 text-left">
          <Calendar className="w-5 h-5 text-brand-400 mb-3" />
          <div className="text-sm font-medium text-white">Book now</div>
          <div className="text-xs text-gray-400 mt-1">Reserve a time slot</div>
        </button>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <Bell className="w-5 h-5 text-gold-400 mb-3" />
          <div className="text-sm font-medium text-white">Queue status</div>
          <div className="text-xs text-gray-400 mt-1">{queueEntry ? `Position #${queueEntry.position}` : 'No queue joined'}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Popular services</h3>
          <span className="text-xs text-gray-500">Top picks</span>
        </div>
        <div className="space-y-3">
          {services.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white font-medium">{item.name}</div>
                <div className="text-xs text-gray-400">{item.duration_minutes} mins · {item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-brand-300 font-semibold">₹{item.price}</div>
                {item.is_popular && <div className="text-[11px] text-gold-300">Popular</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="text-sm font-semibold text-white mb-3">Top stylists</div>
        <div className="space-y-3">
          {staff.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold">{item.avatar || item.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{item.name}</div>
                <div className="text-xs text-gray-400">{item.specialty}</div>
              </div>
              <div className="text-xs text-gold-300">⭐ {item.rating}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueueTab({ profile, queue }) {
  const userQueue = queue.find((item) => item.user_id === profile?.id) || queue.find((item) => item.customer_name === profile?.name);
  return (
    <div className="p-4 space-y-4">
      {userQueue && (
        <div className="glass rounded-2xl p-5 border border-brand-500/25">
          <div className="text-xs text-gray-500 mb-1">Your live queue</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold text-white">#{userQueue.position}</div>
              <div className="text-sm text-gray-400 mt-1">{userQueue.estimated_wait_minutes} min estimated wait</div>
            </div>
            <StatusPill status={userQueue.status} />
          </div>
        </div>
      )}
      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="text-sm font-semibold text-white mb-3">Queue board</div>
        <div className="space-y-2">
          {queue.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl ${item.user_id === profile?.id ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-white/5'}`}>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">{item.position}</div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{item.user_id === profile?.id ? 'You' : item.customer_name}</div>
                <div className="text-xs text-gray-400">{item.service_name} · {item.staff_name}</div>
              </div>
              <StatusPill status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ profile, bookings, notifications, staff }) {
  const completed = bookings.filter((item) => item.status === 'completed');
  return (
    <div className="p-4 space-y-4">
      <div className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-xl font-bold">{(profile?.name || 'C').charAt(0)}</div>
          <div>
            <div className="text-white font-semibold">{profile?.name || 'Customer'}</div>
            <div className="text-xs text-gray-400">{profile?.phone || profile?.email || 'SalonOS Member'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{completed.length}</div>
            <div className="text-[11px] text-gray-500">Visits</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{profile?.loyalty_points || 120}</div>
            <div className="text-[11px] text-gray-500">Points</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-lg font-bold text-white">{staff.slice(0, 2).length}</div>
            <div className="text-[11px] text-gray-500">Favorites</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="text-sm font-semibold text-white mb-3">Recent bookings</div>
        <div className="space-y-3">
          {bookings.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{item.service_name}</div>
                <div className="text-xs text-gray-400">{item.staff_name} · {new Date(item.booking_time).toLocaleDateString()}</div>
              </div>
              <StatusPill status={item.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="text-sm font-semibold text-white mb-3">Notifications</div>
        <div className="space-y-3">
          {notifications.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-xl bg-white/5 p-3">
              <div className="text-sm text-white font-medium">{item.title}</div>
              <div className="text-xs text-gray-400 mt-1">{item.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booked, setBooked] = useState(false);
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { services, staff, bookings, queue, notifications, createBooking, loading, error, mode } = useCustomerAppData(profile);

  const bookedMessage = useMemo(() => booked ? 'Booking saved to the backend successfully.' : '', [booked]);

  async function handleSignOut() {
    await signOut();
    navigate('/login/customer', { replace: true });
  }

  async function handleConfirmBooking(payload) {
    const result = await createBooking(payload);
    if (!result?.error) setBooked(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <Link to="/" className="text-brand-400 text-sm flex items-center justify-center gap-1 hover:text-brand-300">
            <ChevronLeft className="w-4 h-4" /> Back to SalonOS
          </Link>
        </div>

        <div className="glass rounded-[2.5rem] overflow-hidden border border-white/10" style={{ height: '780px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between px-6 py-2 bg-black/20 shrink-0">
            <span className="text-xs text-gray-300">9:41 AM</span>
            <div className="w-20 h-5 bg-black rounded-full" />
            <div className="w-4 h-2 border border-gray-300 rounded-sm"><div className="w-3 h-1.5 bg-gray-300 rounded-sm m-px" /></div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">SalonOS</h1>
              <p className="text-xs text-gray-400">{profile?.name || 'Customer'} · Sam's Creation</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3" />Loading app data…</div>
            ) : bookingOpen ? (
              <BookingFlow services={services} staff={staff} onClose={() => setBookingOpen(false)} onConfirm={handleConfirmBooking} loading={loading} />
            ) : (
              <>
                {error && <div className="mx-4 mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">{error}</div>}
                {bookedMessage && <div className="mx-4 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">{bookedMessage}</div>}
                {activeTab === 'home' && <HomeTab profile={profile} bookings={bookings} queue={queue} services={services} staff={staff} mode={mode} openBooking={() => setBookingOpen(true)} />}
                {activeTab === 'book' && <HomeTab profile={profile} bookings={bookings} queue={queue} services={services} staff={staff} mode={mode} openBooking={() => setBookingOpen(true)} />}
                {activeTab === 'queue' && <QueueTab profile={profile} queue={queue} />}
                {activeTab === 'profile' && <ProfileTab profile={profile} bookings={bookings} notifications={notifications} staff={staff} />}
              </>
            )}
          </div>

          {!bookingOpen && (
            <div className="border-t border-white/10 bg-black/20 shrink-0">
              <div className="flex">
                {TABS.map((tab) => (
                  <button key={tab.id} onClick={() => (tab.id === 'book' ? setBookingOpen(true) : setActiveTab(tab.id))} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${activeTab === tab.id ? 'text-brand-400' : 'text-gray-500'}`}>
                    <tab.icon className="w-5 h-5" />
                    <span className="text-xs">{tab.label}</span>
                    {activeTab === tab.id && <div className="w-1 h-1 rounded-full bg-brand-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

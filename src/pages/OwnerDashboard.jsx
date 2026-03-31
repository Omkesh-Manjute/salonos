import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronLeft,
  Clock,
  DollarSign,
  Filter,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Settings,
  SkipForward,
  Star,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, useOwnerDashboardData } from '../hooks/useSalonBackend';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'queue', label: 'Queue', icon: Clock },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'crm', label: 'CRM', icon: User },
  { id: 'reports', label: 'Reports', icon: Calendar },
];

function StatusBadge({ status }) {
  const map = {
    in_progress: 'bg-emerald-500/20 text-emerald-400',
    waiting: 'bg-yellow-500/20 text-yellow-400',
    next: 'bg-brand-500/20 text-brand-300',
    available: 'bg-emerald-500/20 text-emerald-400',
    break: 'bg-yellow-500/20 text-yellow-400',
    busy: 'bg-red-500/20 text-red-400',
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || 'bg-white/10 text-gray-300'}`}>{status.replace('_', ' ')}</span>;
}

function Sidebar({ active, setActive, open, setOpen, profile }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#0e0e1a] border-r border-white/10 z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Sam's Creation</div>
            <div className="text-xs text-brand-400">Salon Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setActive(item.id); setOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === item.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl glass">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{(profile?.name || 'A').charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{profile?.name || 'Salon Owner'}</div>
              <div className="text-xs text-gray-400">Salon Owner</div>
            </div>
            <Settings className="w-4 h-4 text-gray-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}

function OverviewPage({ profile, metrics, revenueSeries, queue, mode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Good Morning, {profile?.name?.split(' ')[0] || 'Owner'}!</h1>
        <p className="text-gray-400 text-sm">Your salon is connected to the {mode === 'live' ? 'live Supabase backend' : 'sample backend'}.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: formatCurrency(metrics.revenue), icon: DollarSign, color: 'from-brand-600 to-brand-500' },
          { label: 'Total Bookings', value: metrics.bookings, icon: Calendar, color: 'from-gold-600 to-gold-500' },
          { label: 'Live Queue', value: metrics.queue, icon: Clock, color: 'from-blue-600 to-blue-500' },
          { label: 'Average Rating', value: metrics.rating, icon: Star, color: 'from-emerald-600 to-emerald-500' },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-5 border border-white/5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}><card.icon className="w-4 h-4 text-white" /></div>
            <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-xs text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a325c4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a325c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#a325c4" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Bookings by Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueSeries}>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                {revenueSeries.map((_, index) => <Cell key={index} fill={index === 5 ? '#eab308' : '#8619a0'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Live Queue Snapshot</h3>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">{queue.length} active</span>
        </div>
        <div className="space-y-2">
          {queue.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-gray-300">{item.position}</div>
              <div className="flex-1">
                <span className="text-sm text-white font-medium">{item.customer_name}</span>
                <span className="text-xs text-gray-400"> · {item.service_name} · {item.staff_name}</span>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueuePage({ queue, services, onCallNext, onAddWalkIn }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState(services[0]?.name || 'Haircut');

  async function submitWalkIn() {
    if (!name.trim()) return;
    await onAddWalkIn({ customerName: name, serviceName });
    setName('');
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Queue</h1>
          <p className="text-gray-400 text-sm">Realtime queue synced with Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCallNext} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"><SkipForward className="w-4 h-4" /> Call Next</button>
          <button onClick={() => setShowAdd((current) => !current)} className="glass border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Walk-in</button>
        </div>
      </div>
      {showAdd && (
        <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer name" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50" />
          <select value={serviceName} onChange={(event) => setServiceName(event.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
            {services.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <button onClick={submitWalkIn} className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">Save</button>
        </div>
      )}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[60px_1fr_160px_140px_120px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>#</span><span>Customer</span><span>Service</span><span>Stylist</span><span>Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {queue.map((item) => (
            <div key={item.id} className="grid grid-cols-1 lg:grid-cols-[60px_1fr_160px_140px_120px] gap-3 items-center px-5 py-4 hover:bg-white/3 transition-colors">
              <span className="text-sm text-brand-300 font-semibold">{item.position}</span>
              <div>
                <div className="font-medium text-white text-sm">{item.customer_name}</div>
                <div className="text-xs text-gray-500">{item.phone || 'Walk-in'} · ETA {item.estimated_wait_minutes} min</div>
              </div>
              <span className="text-sm text-gray-300">{item.service_name}</span>
              <span className="text-sm text-gray-300">{item.staff_name}</span>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffPage({ staff }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Staff</h1>
        <p className="text-gray-400 text-sm">Live team availability and performance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold">{member.avatar}</div>
              <div>
                <div className="text-white font-semibold">{member.name}</div>
                <div className="text-xs text-gray-400">{member.specialty}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Status</span><StatusBadge status={member.status || (member.available ? 'available' : 'busy')} /></div>
              <div className="flex justify-between"><span className="text-gray-400">Today's clients</span><span className="text-white">{member.today || member.today_clients || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Rating</span><span className="text-gold-300">⭐ {member.rating}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CRMPage({ customers }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer CRM</h1>
          <p className="text-gray-400 text-sm">Tenant-scoped customer records from Supabase</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="Search..." className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50" />
        </div>
      </div>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_140px_100px_100px_120px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>Customer</span><span>Contact</span><span>Visits</span><span>Points</span><span>Spend</span>
        </div>
        <div className="divide-y divide-white/5">
          {customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-1 lg:grid-cols-[1fr_140px_100px_100px_120px] gap-3 items-center px-5 py-4 hover:bg-white/3 transition-colors">
              <div>
                <div className="text-sm font-medium text-white">{customer.name}</div>
                <div className="text-xs text-gray-500">Last visit · {new Date(customer.last_visit || customer.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-gray-300">{customer.phone || customer.email || '—'}</div>
              <div className="text-sm text-white">{customer.visits || 0}</div>
              <div className="text-sm text-brand-300">{customer.loyalty_points || 0}</div>
              <div className="text-sm text-white">{formatCurrency(customer.spend || 0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsPage({ revenueSeries, peakHours }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 text-sm">Revenue and operational analytics</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Service revenue trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="ownerReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#eab308" fill="url(#ownerReport)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Peak hours</h3>
          <div className="space-y-3">
            {peakHours.map((item) => (
              <div key={item.hour}>
                <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-300">{item.hour}</span><span className="text-white">{item.bookings} bookings</span></div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-600 to-gold-500 rounded-full" style={{ width: `${Math.min(100, item.bookings * 20)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, signOut, loading: authLoading } = useAuth();
  const { metrics, revenueSeries, queue, staff, customers, services, peakHours, loading, error, callNext, addWalkIn, mode } = useOwnerDashboardData(profile);

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
          <button onClick={() => navigate('/login/owner')} className="mt-4 text-brand-400 text-sm">Go to Login</button>
        </div>
      </div>
    );
  }

  const pageMap = useMemo(() => ({
    overview: <OverviewPage profile={profile} metrics={metrics} revenueSeries={revenueSeries} queue={queue} mode={mode} />,
    queue: <QueuePage queue={queue} services={services} onCallNext={callNext} onAddWalkIn={addWalkIn} />,
    staff: <StaffPage staff={staff} />,
    crm: <CRMPage customers={customers} />,
    reports: <ReportsPage revenueSeries={revenueSeries} peakHours={peakHours} />,
  }), [addWalkIn, callNext, customers, metrics, mode, peakHours, profile, queue, revenueSeries, services, staff]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar active={activePage} setActive={setActivePage} open={sidebarOpen} setOpen={setSidebarOpen} profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0a0a0f] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <Link to="/" className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm"><ChevronLeft className="w-4 h-4" /> Landing</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input placeholder="Search..." className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-48" />
            </div>
            <div className="relative"><Bell className="w-5 h-5 text-gray-400" /><div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-500 text-white text-[8px] flex items-center justify-center">3</div></div>
            <button onClick={async () => { await signOut(); navigate('/login/owner', { replace: true }); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{(profile?.name || 'A').charAt(0)}</div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading ? <div className="text-gray-400">Loading owner dashboard…</div> : <>{error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</div>}{pageMap[activePage]}</>}
        </main>
      </div>
    </div>
  );
}

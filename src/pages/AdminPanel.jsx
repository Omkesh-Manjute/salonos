import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  Eye,
  Globe,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, useAdminDashboardData } from '../hooks/useSalonBackend';

const NAV = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'salons', label: 'Salons', icon: Building2 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  const map = {
    active: 'bg-emerald-500/20 text-emerald-400',
    trial: 'bg-brand-500/20 text-brand-300',
    pending: 'bg-yellow-500/20 text-yellow-400',
    inactive: 'bg-red-500/20 text-red-400',
    basic: 'bg-white/10 text-gray-300',
    pro: 'bg-brand-500/20 text-brand-300',
    enterprise: 'bg-gold-500/20 text-gold-300',
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[normalized] || 'bg-white/10 text-gray-300'}`}>{status}</span>;
}

function AdminSidebar({ active, setActive, open, setOpen, profile, onSignOut }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#080810] border-r border-white/10 z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
          <div>
            <div className="font-bold text-white text-sm">SalonOS Admin</div>
            <div className="text-xs text-red-400">Super Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => { setActive(item.id); setOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === item.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            <button onClick={onSignOut} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center text-white font-bold text-xs">{(profile?.name || 'SA').split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
            <div>
              <div className="text-xs font-medium text-white">{profile?.name || 'Super Admin'}</div>
              <div className="text-xs text-gray-500">{profile?.email || 'admin@salonos.in'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminOverview({ growthSeries, planStats, totalMRR, salons, mode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm">{mode === 'live' ? 'Live Supabase tenant metrics.' : 'Sample backend preview until env keys are configured.'}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Salons', value: salons.filter((item) => item.status === 'active').length, icon: Building2, color: 'from-brand-600 to-brand-500' },
          { label: 'Total MRR', value: formatCurrency(totalMRR), icon: DollarSign, color: 'from-gold-600 to-gold-500' },
          { label: 'Tenants', value: salons.length, icon: Globe, color: 'from-blue-600 to-blue-500' },
          { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'from-emerald-600 to-emerald-500' },
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
          <h3 className="font-semibold text-white mb-4">Salon growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthSeries}>
              <defs>
                <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a325c4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a325c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="salons" stroke="#a325c4" fill="url(#adminArea)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">MRR trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthSeries}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="mrr" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Plan distribution</h3>
          <span className="text-xs text-gray-500">Multi-tenant snapshot</span>
        </div>
        <div className="space-y-4">
          {planStats.map((item) => {
            const total = planStats.reduce((sum, current) => sum + current.value, 0) || 1;
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between text-sm mb-1"><span className="text-white">{item.name}</span><span className="text-gray-400">{item.value} salons · {pct}%</span></div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className={`h-full rounded-full ${item.name === 'Basic' ? 'bg-gray-400' : item.name === 'Pro' ? 'bg-brand-500' : 'bg-gold-500'}`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SalonsPage({ salons }) {
  const [search, setSearch] = useState('');
  const filtered = salons.filter((salon) => {
    const value = `${salon.name} ${salon.owner_name || salon.owner || ''} ${salon.city || ''}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Salons</h1>
          <p className="text-gray-400 text-sm">{salons.length} registered tenants</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> Add Salon</button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search salons or owners..." className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50" />
      </div>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_120px_80px_80px_100px_90px_100px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>Salon</span><span>Owner</span><span>Plan</span><span>Status</span><span>Bookings</span><span>Revenue</span><span>Actions</span>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map((salon) => (
            <div key={salon.id} className="flex flex-col lg:grid lg:grid-cols-[1fr_120px_80px_80px_100px_90px_100px] gap-3 items-start lg:items-center px-5 py-4 hover:bg-white/3 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center shrink-0"><Scissors className="w-3 h-3 text-white" /></div>
                  <div>
                    <div className="font-medium text-white text-sm">{salon.name}</div>
                    <div className="text-xs text-gray-500">{salon.city} · Joined {salon.joined ? new Date(salon.joined).toLocaleDateString() : salon.created_at ? new Date(salon.created_at).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-300 lg:block hidden">{salon.owner_name || salon.owner || 'Owner'}</span>
              <div className="lg:block hidden"><StatusBadge status={String(salon.plan).charAt(0).toUpperCase() + String(salon.plan).slice(1)} /></div>
              <div className="lg:block hidden"><StatusBadge status={String(salon.status).charAt(0).toUpperCase() + String(salon.status).slice(1)} /></div>
              <span className="text-sm text-gray-300 lg:block hidden">{salon.bookings || 0}</span>
              <span className="text-sm text-brand-400 font-medium lg:block hidden">{formatCurrency(salon.revenue || 0)}</span>
              <div className="flex items-center gap-2">
                <button className="glass border border-white/10 hover:border-brand-500/50 text-gray-300 hover:text-white p-1.5 rounded-lg transition-all"><Eye className="w-3.5 h-3.5" /></button>
                {String(salon.status).toLowerCase() === 'pending' && <button className="glass border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg transition-all"><CheckCircle className="w-3.5 h-3.5" /></button>}
                {String(salon.status).toLowerCase() !== 'inactive' && <button className="glass border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-all"><XCircle className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityPage({ auditLogs }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security & Audit Logs</h1>
        <p className="text-gray-400 text-sm">RLS, tenant isolation, and notification audit events</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Data Isolation', desc: 'All queries filtered by tenant_id', status: 'Enforced', icon: Shield, ok: true },
          { label: 'Row-Level Security', desc: 'DB-level policies active', status: 'Active', icon: CheckCircle, ok: true },
          { label: 'Audit Events', desc: 'Realtime platform event stream', status: `${auditLogs.length} Events`, icon: Clock, ok: true },
        ].map((item) => (
          <div key={item.label} className={`glass rounded-2xl p-5 border ${item.ok ? 'border-emerald-500/20' : 'border-red-500/30'}`}>
            <div className="flex items-center gap-3 mb-2"><item.icon className={`w-5 h-5 ${item.ok ? 'text-emerald-400' : 'text-red-400'}`} /><span className="font-semibold text-white text-sm">{item.label}</span></div>
            <p className="text-xs text-gray-400 mb-2">{item.desc}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{item.status}</span>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10"><h3 className="font-semibold text-white">Recent audit events</h3></div>
        <div className="divide-y divide-white/5">
          {auditLogs.map((item, index) => (
            <div key={item.id || index} className={`flex items-center gap-4 px-5 py-4 ${item.risk === 'high' ? 'bg-red-500/5' : ''}`}>
              <span className="text-xs text-gray-500 w-20 shrink-0">{item.time}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{item.event}</div>
                <div className="text-xs text-gray-400">{item.user} · {item.salon} · {item.ip}</div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${item.risk === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{item.risk === 'high' ? 'Alert' : 'Normal'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-6 border border-brand-500/20">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-400" /> Tenant Isolation Policy</h3>
        <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-brand-300 space-y-1">
          <div><span className="text-gray-500">-- Every query is automatically scoped</span></div>
          <div><span className="text-brand-400">SELECT</span> * <span className="text-brand-400">FROM</span> bookings</div>
          <div className="pl-4"><span className="text-brand-400">WHERE</span> tenant_id = <span className="text-gold-400">current_tenant_id()</span>;</div>
          <div className="mt-2"><span className="text-gray-500">-- Admin bypass is allowed only by policy</span></div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-gray-400 text-sm">Global pricing, notifications, and platform toggles</p>
      </div>
      {[
        {
          section: 'Subscription Plans',
          items: [
            { label: 'Basic Plan Price', value: '₹999/month', type: 'text' },
            { label: 'Pro Plan Price', value: '₹1,499/month', type: 'text' },
            { label: 'Enterprise Plan', value: 'Custom pricing', type: 'text' },
            { label: 'Free Trial', value: '14 days', type: 'text' },
          ],
        },
        {
          section: 'Notifications',
          items: [
            { label: 'SMS Notifications', value: true, type: 'toggle' },
            { label: 'Push Notifications', value: true, type: 'toggle' },
            { label: 'Email Alerts', value: false, type: 'toggle' },
          ],
        },
        {
          section: 'Platform',
          items: [
            { label: 'Maintenance Mode', value: false, type: 'toggle' },
            { label: 'New Salon Signups', value: true, type: 'toggle' },
            { label: 'Realtime Queue Sync', value: true, type: 'toggle' },
          ],
        },
      ].map((group) => (
        <div key={group.section} className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">{group.section}</h3>
          <div className="space-y-4">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{item.label}</span>
                {item.type === 'toggle' ? (
                  <button className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? 'bg-brand-600' : 'bg-white/10'}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${item.value ? 'left-[22px]' : 'left-0.5'}`} /></button>
                ) : (
                  <span className="text-sm text-brand-400 font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { salons, auditLogs, growthSeries, planStats, totalMRR, loading, error, mode } = useAdminDashboardData();

  const pageMap = useMemo(() => ({
    overview: <AdminOverview growthSeries={growthSeries} planStats={planStats} totalMRR={totalMRR} salons={salons} mode={mode} />,
    salons: <SalonsPage salons={salons} />,
    security: <SecurityPage auditLogs={auditLogs} />,
    settings: <SettingsPage />,
  }), [auditLogs, growthSeries, mode, planStats, salons, totalMRR]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar active={activePage} setActive={setActivePage} open={sidebarOpen} setOpen={setSidebarOpen} profile={profile} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0a0a0f] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <Link to="/" className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm"><ChevronLeft className="w-4 h-4" /> Landing</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium hidden sm:block">Super Admin</div>
            <div className="relative"><Bell className="w-5 h-5 text-gray-400" /><div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">1</div></div>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center text-white font-bold text-xs">{(profile?.name || 'SA').split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading ? <div className="text-gray-400">Loading admin console…</div> : <>{error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</div>}{pageMap[activePage]}</>}
        </main>
      </div>
    </div>
  );
}

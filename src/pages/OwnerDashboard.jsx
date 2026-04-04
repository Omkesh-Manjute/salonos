import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronLeft,
  Clock,
  Copy,
  Check,
  DollarSign,
  Filter,
  LogOut,
  Menu,
  Plus,
  QrCode,
  RefreshCw,
  Scissors,
  Search,
  Settings,
  SkipForward,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, useOwnerDashboardData } from '../hooks/useSalonBackend';
import SetupShop from './SetupShop';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'queue', label: 'Queue', icon: Clock },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'crm', label: 'CRM', icon: User },
  { id: 'reports', label: 'Reports', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
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

function Sidebar({ active, setActive, open, setOpen, profile, salon, allSalons, onSwitchSalon }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#0e0e1a] border-r border-white/10 z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-5 border-b border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm truncate max-w-[140px]">{salon?.name || "My Salon"}</div>
              <div className="text-xs text-brand-400">{salon?.is_setup ? 'Live' : 'Setup Required'}</div>
            </div>
          </div>

          {allSalons.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 font-bold">Switch Salon</label>
              <select 
                value={salon?.id || ''} 
                onChange={(e) => onSwitchSalon(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-brand-300 focus:outline-none focus:border-brand-500/50 cursor-pointer"
              >
                {allSalons.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#0e0e1a] text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {salon?.slug && (
          <div className="px-4 py-2 border-b border-white/5">
            <div className="text-[10px] text-gray-500 mb-1">Salon Code</div>
            <div className="text-xs text-brand-400 font-mono">@{salon.slug}</div>
          </div>
        )}
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
          {queue.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Queue is empty right now</p>}
        </div>
      </div>
    </div>
  );
}

function QueuePage({ queue, services, staff, onCallNext, onAddWalkIn, onUpdateStaff }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState(services[0]?.name || 'Haircut');
  const [pendingStaff, setPendingStaff] = useState({}); // { entryId: staffName }

  async function handleAddWalkIn() {
    if (!name.trim()) return;
    await onAddWalkIn({ customerName: name, serviceName });
    setName(''); setShowAdd(false);
  }

  async function handleSaveStaff(id) {
    const newName = pendingStaff[id];
    if (!newName) return;
    const { error } = await onUpdateStaff(id, newName);
    if (!error) {
      setPendingStaff(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
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
          <button onClick={() => setShowAdd((c) => !c)} className="glass border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Walk-in</button>
        </div>
      </div>
      {showAdd && (
        <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50" />
          <select value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
            {services.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            {services.length === 0 && <option value="General">General</option>}
          </select>
          <button onClick={handleAddWalkIn} className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">Save</button>
        </div>
      )}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[60px_1fr_160px_180px_120px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>#</span><span>Customer</span><span>Service</span><span>Stylist</span><span>Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {queue.map((item) => (
            <div key={item.id} className="grid grid-cols-1 lg:grid-cols-[60px_1fr_160px_180px_120px] gap-3 items-center px-5 py-4 hover:bg-white/3 transition-colors">
              <span className="text-sm text-brand-300 font-semibold">{item.position}</span>
              <div>
                <div className="font-medium text-white text-sm">{item.customer_name}</div>
                <div className="text-xs text-gray-500">{item.phone || 'Walk-in'} · ETA {item.estimated_wait_minutes} min</div>
              </div>
              <span className="text-sm text-gray-300">{item.service_name}</span>
              <div className="flex items-center gap-2">
                <select 
                  value={pendingStaff[item.id] || item.staff_name} 
                  onChange={(e) => setPendingStaff(prev => ({ ...prev, [item.id]: e.target.value }))}
                  className="bg-transparent border-b border-white/10 text-brand-300 focus:outline-none focus:border-brand-500 cursor-pointer text-sm"
                >
                  {staff.map(s => <option key={s.id} value={s.name} className="bg-[#0e0e1a] text-white">{s.name}</option>)}
                </select>
                {pendingStaff[item.id] && pendingStaff[item.id] !== item.staff_name && (
                  <button 
                    onClick={() => handleSaveStaff(item.id)}
                    className="p-1 rounded-md bg-brand-600/20 text-brand-400 hover:bg-brand-600/40 transition-colors"
                    title="Save Stylist"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {queue.length === 0 && <div className="py-12 text-center text-gray-500 text-sm">Queue is empty</div>}
        </div>
      </div>
    </div>
  );
}

function StaffPage({ staff, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', specialty: '', experience: '', avatar_url: '' });

  function handleEdit(member) {
    setEditing(member.id);
    setFormData({ name: member.name, specialty: member.specialty, experience: member.experience || '', avatar_url: member.avatar_url || '' });
    setError(''); setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) return;
    setSaving(true); setError('');
    try {
      const result = editing
        ? await onUpdate(editing, formData)
        : await onAdd(formData);
      if (result?.error) throw new Error(result.error.message || 'Failed to save.');
      setFormData({ name: '', specialty: '', experience: '', avatar_url: '' });
      setEditing(null); setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-gray-400 text-sm">Manage your team — scoped to your salon</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', specialty: '', experience: '', avatar_url: '' }); }} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-white font-semibold">{editing ? 'Edit' : 'New'} Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[['name', 'Full Name', 'e.g. Rahul Sharma'], ['specialty', 'Specialty', 'e.g. Master Stylist'], ['experience', 'Experience', 'e.g. 5 Years'], ['avatar_url', 'Photo URL', 'https://…']].map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1.5 ml-1">{label}</label>
                <input value={formData[field]} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
              </div>
            ))}
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">{error}</div>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-70">
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {editing ? 'Update' : 'Add Member'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="glass rounded-2xl p-5 border border-white/5 group hover:border-brand-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg">{member.avatar}</div>
                )}
                <div>
                  <div className="text-white font-semibold">{member.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{member.specialty}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(member)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-brand-400"><Settings className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Remove ${member.name}?`)) onDelete(member.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/3 p-2 rounded-lg">
                <span className="text-gray-400">Status</span>
                <StatusBadge status={member.status || 'available'} />
              </div>
              <div className="flex justify-between px-2"><span className="text-gray-500">Exp.</span><span className="text-gray-300">{member.experience || '—'}</span></div>
              <div className="flex justify-between px-2"><span className="text-gray-500">Rating</span><span className="text-gold-400">⭐ {member.rating}</span></div>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full py-12 text-center glass rounded-2xl border border-dashed border-white/10">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No team members yet. Add your first stylist!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServicesPage({ services, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'General', duration_minutes: 30 });

  const DEFAULT_NAMES = ['Haircut', 'Shaving', 'Hair Color', 'Facial', 'Massage', 'Beard Trim'];

  async function handleSave() {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      if (editingId) await onEdit(editingId, { name: form.name, price: Number(form.price), category: form.category, duration_minutes: Number(form.duration_minutes) });
      else await onAdd({ name: form.name, price: Number(form.price), category: form.category, duration_minutes: Number(form.duration_minutes) });
      setShowForm(false); setEditingId(null); setForm({ name: '', price: '', category: 'General', duration_minutes: 30 });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services & Pricing</h1>
          <p className="text-gray-400 text-sm">Manage what you offer and set prices</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', price: '', category: 'General', duration_minutes: 30 }); }} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-white font-semibold">{editingId ? 'Edit' : 'New'} Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Service Name</label>
              <input list="default-services" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Haircut" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
              <datalist id="default-services">{DEFAULT_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 200" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="General" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Duration (mins)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-70">
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {editingId ? 'Update' : 'Add Service'}
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_100px_120px_80px_60px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>Service</span><span>Category</span><span>Duration</span><span>Price</span><span></span>
        </div>
        <div className="divide-y divide-white/5">
          {services.map((svc) => (
            <div key={svc.id} className="grid grid-cols-1 lg:grid-cols-[1fr_100px_120px_80px_60px] gap-3 items-center px-5 py-4 hover:bg-white/3 transition-colors group">
              <div className="font-medium text-white text-sm">{svc.name}</div>
              <span className="text-sm text-gray-400">{svc.category || 'General'}</span>
              <span className="text-sm text-gray-400">{svc.duration_minutes} mins</span>
              <span className="text-sm text-brand-300 font-semibold">₹{svc.price}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(svc.id); setForm({ name: svc.name, price: svc.price, category: svc.category || 'General', duration_minutes: svc.duration_minutes || 30 }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-brand-400"><Settings className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Delete "${svc.name}"?`)) onDelete(svc.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="py-12 text-center">
              <Scissors className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No services yet. Add your first service above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ salon, onSave }) {
  const [name, setName] = useState(salon?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const salonUrl = salon?.slug ? `${window.location.origin}/salon/${salon.slug}` : '';
  const qrSrc = salon?.slug ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(salonUrl)}&bgcolor=0a0a0f&color=a855f7&margin=12` : '';

  async function handleSave() {
    setSaving(true);
    await onSave({ name });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(salonUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your salon details and share with customers</p>
      </div>

      {/* QR + Share */}
      {salon?.slug && (
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><QrCode className="w-4 h-4 text-brand-400" /> Share Your Salon</h3>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="bg-white/5 rounded-2xl p-3 shrink-0">
              <img src={qrSrc} alt="Salon QR Code" className="w-32 h-32 rounded-xl" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Salon Code</div>
                <div className="text-brand-300 font-mono font-semibold">@{salon.slug}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">Shareable Link</div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-xs text-white font-mono flex-1 truncate">{salonUrl}</span>
                  <button onClick={copyLink} className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">Share this link or QR code with customers so they can book appointments at your salon.</p>
            </div>
          </div>
        </div>
      )}

      {/* Salon name */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Store className="w-4 h-4 text-brand-400" /> Salon Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Salon Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50" />
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-70">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
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
          <p className="text-gray-400 text-sm">Customer records for your salon</p>
        </div>
      </div>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_140px_100px_100px_120px] gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>Customer</span><span>Contact</span><span>Visits</span><span>Points</span><span>Spend</span>
        </div>
        <div className="divide-y divide-white/5">
          {customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-1 lg:grid-cols-[1fr_140px_100px_100px_120px] gap-3 items-center px-5 py-4 hover:bg-white/3">
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
          {customers.length === 0 && <div className="py-12 text-center text-gray-500 text-sm">No customers yet</div>}
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
            {peakHours.length === 0 && <p className="text-sm text-gray-500">No booking data yet</p>}
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
  const {
    metrics, revenueSeries, queue, staff, customers, services, peakHours, salon,
    loading, error, needsSetup,
    callNext, addWalkIn, addStaff, updateStaff, deleteStaff,
    addService, editService, removeService, saveSalonSettings,
    updateQueueStaff,
    mode,
  } = useOwnerDashboardData(profile);

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

  // If salon not set up, show the setup flow
  if (!loading && needsSetup) {
    return <SetupShop />;
  }

  const pageMap = {
    overview: <OverviewPage profile={profile} metrics={metrics} revenueSeries={revenueSeries} queue={queue} mode={mode} />,
    queue: <QueuePage 
      queue={queue} 
      services={services} 
      staff={staff}
      onCallNext={callNext} 
      onAddWalkIn={addWalkIn} 
      onUpdateStaff={updateQueueStaff}
    />,
    staff: <StaffPage staff={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} />,
    services: <ServicesPage services={services} onAdd={addService} onEdit={editService} onDelete={removeService} />,
    crm: <CRMPage customers={customers} />,
    reports: <ReportsPage revenueSeries={revenueSeries} peakHours={peakHours} />,
    settings: <SettingsPage salon={salon} onSave={saveSalonSettings} />,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar 
        active={activePage} 
        setActive={setActivePage} 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        profile={profile} 
        salon={salon}
        allSalons={allSalons}
        onSwitchSalon={switchSalon}
      />
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
            <button onClick={async () => { await signOut(); navigate('/login/owner', { replace: true }); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"><LogOut className="w-4 h-4" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">{(profile?.name || 'A').charAt(0)}</div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin" /> Loading dashboard…</div>
          ) : (
            <>
              {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</div>}
              {pageMap[activePage]}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

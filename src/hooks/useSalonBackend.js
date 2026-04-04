import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addStaffMember,
  addToQueue,
  createBookingWithQueue,
  createService,
  deleteService,
  getQueueBySalonId,
  getQueueByTenant,
  getSalonsByOwner,
  isSupabaseConfigured,
  listBookings,
  listNotifications,
  listSalons,
  listServicesBySalonId,
  listServicesByTenant,
  listServicesForSalon,
  listStaffBySalonId,
  listStaffByOwner,
  listStaffForSalon,
  listUsersByTenant,
  resequenceQueue,
  subscribeToTenantTable,
  supabase,
  updateBookingStatus,
  updateQueueEntry,
  updateService,
  updateSalon,
} from '../lib/supabase';
import {
  cloneSample,
  sampleBookings,
  sampleCustomers,
  sampleNotifications,
  sampleQueue,
  sampleSalons,
  sampleServices,
  sampleStaff,
  sampleSubscriptions,
} from '../lib/sampleData';
import { sendNotification } from '../lib/firebase';

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function computeRevenueSeries(bookings) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = labels.map((day) => ({ day, revenue: 0, bookings: 0 }));
  bookings.forEach((booking) => {
    const date = new Date(booking.booking_time);
    const index = (date.getDay() + 6) % 7;
    base[index].revenue += Number(booking.total_amount || 0);
    base[index].bookings += 1;
  });
  return base;
}

function computePeakHours(bookings) {
  const buckets = {};
  bookings.forEach((booking) => {
    const hour = new Date(booking.booking_time).getHours();
    const label = `${hour.toString().padStart(2, '0')}:00`;
    buckets[label] = (buckets[label] || 0) + 1;
  });
  return Object.entries(buckets).map(([hour, bookingsCount]) => ({ hour, bookings: bookingsCount })).sort((a, b) => a.hour.localeCompare(b.hour));
}

// ─── Sample state (demo / offline mode) ────────────────────────────────────

function useSampleTenantState(profile) {
  const tenantId = profile?.tenant_id || 'tenant-sams-creation';
  const userId = profile?.id || 'usr-c-1';
  const [services] = useState(() => cloneSample(sampleServices.filter((item) => item.tenant_id === tenantId)));
  const [staff, setStaff] = useState(() => cloneSample(sampleStaff.filter((item) => item.tenant_id === tenantId)));
  const [customers] = useState(() => cloneSample(sampleCustomers.filter((item) => item.tenant_id === tenantId)));
  const [bookings, setBookings] = useState(() => cloneSample(sampleBookings.filter((item) => item.tenant_id === tenantId)));
  const [queue, setQueue] = useState(() => cloneSample(sampleQueue.filter((item) => item.tenant_id === tenantId)));
  const [notifications, setNotifications] = useState(() => cloneSample(sampleNotifications.filter((item) => item.tenant_id === tenantId && item.user_id === userId)));
  const salons = useMemo(() => cloneSample(sampleSalons), []);
  const subscriptions = useMemo(() => cloneSample(sampleSubscriptions), []);

  const createBookingFn = useCallback(async ({ serviceId, staffName, bookingType, bookingTime, paymentMethod }) => {
    const service = services.find((item) => item.id === serviceId);
    const bookingId = `bkg-${Date.now()}`;
    const booking = {
      id: bookingId, tenant_id: tenantId, user_id: userId,
      service_id: service?.id, service_name: service?.name || 'Service',
      staff_name: staffName, booking_time: bookingTime, status: 'confirmed',
      booking_type: bookingType,
      payment_status: paymentMethod === 'Cash at Salon' ? 'pending' : 'paid',
      total_amount: Number(service?.price || 0),
    };
    setBookings((current) => [booking, ...current]);
    if (bookingType === 'queue') {
      setQueue((current) => [...current, {
        id: `que-${Date.now()}`, tenant_id: tenantId, user_id: userId,
        customer_name: profile?.name || 'Customer', phone: profile?.phone || '',
        service_name: booking.service_name, staff_name: staffName,
        position: current.length + 1, estimated_wait_minutes: current.length * 10, status: 'waiting',
      }]);
    }
    setNotifications((current) => [{ id: `not-${Date.now()}`, tenant_id: tenantId, user_id: userId, title: 'Booking confirmed', message: `${booking.service_name} booked successfully.`, type: 'booking_confirmed', read_status: false, created_at: new Date().toISOString() }, ...current]);
    return { data: booking, error: null };
  }, [profile?.name, profile?.phone, services, tenantId, userId]);

  const callNext = useCallback(async () => {
    setQueue((current) => {
      const nextQueue = current.map((entry) => ({ ...entry }));
      const currentActive = nextQueue.find((entry) => entry.status === 'in_progress');
      if (currentActive) currentActive.status = 'done';
      const nextWaiting = nextQueue.find((entry) => entry.status === 'next' || entry.status === 'waiting');
      if (nextWaiting) nextWaiting.status = 'in_progress';
      const following = nextQueue.filter((entry) => entry.status === 'waiting').sort((a, b) => a.position - b.position)[0];
      if (following) following.status = 'next';
      return nextQueue.filter((entry) => entry.status !== 'done').sort((a, b) => a.position - b.position).map((entry, index) => ({ ...entry, position: index + 1, estimated_wait_minutes: index * 10 }));
    });
    return { error: null };
  }, []);

  const addWalkIn = useCallback(async ({ customerName, serviceName }) => {
    setQueue((current) => [...current, {
      id: `que-${Date.now()}`, tenant_id: tenantId, user_id: null,
      customer_name: customerName, phone: '', service_name: serviceName,
      staff_name: staff[0]?.name || 'Team',
      position: current.length + 1, estimated_wait_minutes: current.length * 10, status: 'waiting',
    }]);
    return { error: null };
  }, [staff, tenantId]);

  const addStaff = useCallback(async ({ name, specialty, experience, avatar_url }) => {
    const newStaff = {
      id: crypto.randomUUID?.() || `stf-${Date.now()}`, tenant_id: tenantId,
      name, specialty, experience, avatar: name?.charAt(0) || 'S', avatar_url,
      available: true, rating: 4.8, today_clients: 0,
    };
    setStaff((current) => [...current, newStaff]);
    return { data: newStaff, error: null };
  }, [tenantId]);

  const updateStaff = useCallback(async (id, updates) => ({ data: updates, error: null }), []);
  const deleteStaff = useCallback(async (id) => ({ error: null }), []);

  return { services, staff, customers, bookings, queue, notifications, salons, subscriptions, createBooking: createBookingFn, callNext, addWalkIn, addStaff, updateStaff, deleteStaff };
}

// ─── Customer App Hook ────────────────────────────────────────────────────

export function useCustomerAppData(profile) {
  const sampleState = useSampleTenantState(profile);
  const userId = profile?.id;

  // Primary: salon_id from localStorage (set when customer scans QR / opens salon link)
  const [localSalonId, setLocalSalonId] = useState(() => localStorage.getItem('salon_id') || '');

  const [state, setState] = useState({
    loading: isSupabaseConfigured && !!localSalonId,
    services: [],
    staff: [],
    bookings: [],
    queue: [],
    notifications: [],
    salon: null,
    error: '',
    needsSalonEntry: !localSalonId && isSupabaseConfigured,
  });

  const load = useCallback(async (salonId) => {
    const activeSalonId = salonId || localSalonId;
    if (!isSupabaseConfigured || !userId || !activeSalonId) {
      setState((current) => ({ ...current, loading: false, needsSalonEntry: !activeSalonId }));
      return;
    }

    try {
      // Fetch salon first to get owner_id + tenant_id for robust OR queries
      const { data: salon } = await supabase.from('salons').select('*').eq('id', activeSalonId).single();

      const [staffRes, servicesRes, bookingsRes, queueRes, notificationsRes] = await Promise.all([
        listStaffForSalon(activeSalonId, salon?.owner_id),
        listServicesForSalon(activeSalonId, salon?.tenant_id, salon?.owner_id),
        listBookings({ salonId: activeSalonId, tenantId: salon?.tenant_id, userId }),
        getQueueBySalonId(activeSalonId),
        listNotifications(userId),
      ]);

      const staff = (staffRes.data || []).map((item) => ({
        id: item.id, name: item.name,
        specialty: item.specialty || 'Salon Expert',
        rating: item.rating || 5.0,
        experience: item.experience || '5 yrs',
        available: item.available ?? true,
        avatar: item.name?.charAt(0) || 'S',
        avatar_url: item.avatar_url || '',
        today_clients: item.today_clients || 0,
      }));

      // Only show active queue entries to customer
      const activeQueue = (queueRes.data || []).filter(q => ['waiting', 'in_progress', 'next'].includes(q.status));

      setState({
        loading: false,
        services: servicesRes.data || [],
        staff,
        bookings: bookingsRes.data || [],
        queue: activeQueue,
        notifications: notificationsRes.data || [],
        salon: salon || null,
        error: '',
        needsSalonEntry: false,
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || 'Failed to load.' }));
    }
  }, [userId, localSalonId]);

  // Allow customer to enter a salon slug manually
  const enterSalonBySlug = useCallback(async (slug) => {
    if (!slug) return;
    const { data: salon } = await supabase.from('salons').select('*').eq('slug', slug.trim()).single();
    if (!salon) return { error: 'Salon not found' };
    localStorage.setItem('salon_id', salon.id);
    localStorage.setItem('salon_name', salon.name);
    localStorage.setItem('salon_slug', salon.slug);
    setLocalSalonId(salon.id);
    await load(salon.id);
    return { error: null };
  }, [load]);

  useEffect(() => {
    load();
    if (!isSupabaseConfigured || !localSalonId || !userId) return undefined;
    const offQueue = subscribeToTenantTable({ table: 'queue', salonId: localSalonId, onChange: load });
    const offStaff = subscribeToTenantTable({ table: 'staff', salonId: localSalonId, onChange: load });
    return () => { offQueue?.(); offStaff?.(); };
  }, [load, localSalonId, userId]);

  const createBooking = useCallback(async ({ serviceId, staffName, bookingType, bookingTime, paymentMethod }) => {
    if (!isSupabaseConfigured || !userId || !localSalonId) {
      return sampleState.createBooking({ serviceId, staffName, bookingType, bookingTime, paymentMethod });
    }
    const service = state.services.find((item) => item.id === serviceId);
    const bookingPayload = {
      salon_id: localSalonId,
      tenant_id: state.salon?.tenant_id,
      user_id: userId,
      service_id: service?.id || null,
      service_name: service?.name || 'Service',
      staff_name: staffName,
      booking_time: bookingTime,
      status: 'confirmed',
      booking_type: bookingType,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'Cash at Salon' ? 'pending' : 'paid',
      total_amount: Number(service?.price || 0),
    };
    const queuePayload = bookingType === 'queue' ? {
      salon_id: localSalonId,
      tenant_id: state.salon?.tenant_id,
      user_id: userId,
      customer_name: profile?.name || 'Customer',
      phone: profile?.phone || '',
      service_name: bookingPayload.service_name,
      staff_name: staffName,
      status: 'waiting',
      position: (state.queue?.length || 0) + 1,
      estimated_wait_minutes: (state.queue?.length || 0) * 10,
    } : null;

    const response = await createBookingWithQueue({ booking: bookingPayload, queueEntry: queuePayload });
    if (!response.error) {
      await sendNotification({ userId, tenantId: state.salon?.tenant_id, type: 'booking_confirmed', message: `${bookingPayload.service_name} booked successfully.` });
      await load();
    }
    return response;
  }, [load, profile?.name, profile?.phone, state.services, state.salon, state.queue, userId, localSalonId, sampleState]);

  if (!isSupabaseConfigured) {
    return { ...sampleState, loading: false, error: '', mode: 'sample', needsSalonEntry: false, enterSalonBySlug };
  }

  return { ...state, createBooking, mode: 'live', enterSalonBySlug };
}

// ─── Owner Dashboard Hook ─────────────────────────────────────────────────

export function useOwnerDashboardData(profile) {
  const sampleState = useSampleTenantState(profile);
  const [state, setState] = useState({
    loading: isSupabaseConfigured,
    services: [],
    staff: [],
    customers: [],
    bookings: [],
    queue: [],
    salon: null,
    error: '',
    needsSetup: false,
  });

  const load = useCallback(async () => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    try {
      // 1. Get owner's salon
      const { data: salons } = await getSalonsByOwner(ownerId);
      const salon = salons?.[0] || null;

      if (!salon || !salon.is_setup) {
        setState((current) => ({ ...current, loading: false, needsSetup: true, salon }));
        return;
      }

      const salonId = salon.id;

      // 2. Fetch all data with robust OR queries (handles legacy data without salon_id)
      const [staffRes, servicesRes, customersRes, bookingsRes, queueRes] = await Promise.all([
        listStaffForSalon(salonId, ownerId),
        listServicesForSalon(salonId, salon.tenant_id, ownerId),
        listUsersByTenant(salon.tenant_id || '', 'customer'),
        listBookings({ salonId, tenantId: salon.tenant_id }),
        getQueueBySalonId(salonId),
      ]);

      const staff = (staffRes.data || []).map((item) => ({
        id: item.id, name: item.name,
        specialty: item.specialty || 'Salon Expert',
        status: item.available === false ? 'break' : 'available',
        today: item.today_clients || 0,
        rating: item.rating || 5.0,
        experience: item.experience || '',
        avatar_url: item.avatar_url || '',
        avatar: item.name?.charAt(0) || 'S',
      }));

      setState({
        loading: false,
        services: servicesRes.data || [],
        customers: (customersRes.data || []).map((item) => ({ ...item, visits: item.metadata?.visits || 0, spend: item.metadata?.spend || 0, last_visit: item.metadata?.last_visit || item.created_at })),
        bookings: bookingsRes.data || [],
        queue: queueRes.data || [],
        staff,
        salon,
        error: staffRes.error?.message || servicesRes.error?.message || '',
        needsSetup: false,
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || 'Failed to load dashboard.' }));
    }
  }, [profile?.id]);

  // ── Staff ──

  const addStaff = useCallback(async ({ name, specialty, experience, avatar_url }) => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.addStaff({ name, specialty, experience, avatar_url });
    const salonId = state.salon?.id;
    try {
      const { data: newStaff, error } = await addStaffMember({ owner_id: ownerId, salon_id: salonId, name, specialty, experience, avatar_url });
      if (error) return { data: null, error };
      await load();
      return { data: newStaff, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [load, sampleState, state.salon, profile?.id]);

  const updateStaff = useCallback(async (id, updates) => {
    if (!isSupabaseConfigured) return sampleState.updateStaff(id, updates);
    const { data, error } = await supabase.from('staff').update({ name: updates.name, specialty: updates.specialty, experience: updates.experience, avatar_url: updates.avatar_url }).eq('id', id).select().single();
    if (!error) await load();
    return { data, error };
  }, [load, sampleState]);

  const deleteStaff = useCallback(async (id) => {
    if (!isSupabaseConfigured) return sampleState.deleteStaff(id);
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) await load();
    return { error };
  }, [load, sampleState]);

  // ── Services ──

  const addService = useCallback(async ({ name, price, category, duration_minutes }) => {
    if (!isSupabaseConfigured) return { error: null };
    const salonId = state.salon?.id;
    const tenantId = state.salon?.tenant_id;
    const { data, error } = await createService({ 
      salon_id: salonId, 
      tenant_id: tenantId, 
      owner_id: ownerId,
      name, 
      price: Number(price), 
      category: category || 'General', 
      duration_minutes: duration_minutes || 30, 
      active: true 
    });
    if (!error) await load();
    return { data, error };
  }, [load, state.salon]);

  const editService = useCallback(async (id, updates) => {
    if (!isSupabaseConfigured) return { error: null };
    const { data, error } = await updateService(id, updates);
    if (!error) await load();
    return { data, error };
  }, [load]);

  const removeService = useCallback(async (id) => {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await deleteService(id);
    if (!error) await load();
    return { error };
  }, [load]);

  // ── Queue ──

  const callNext = useCallback(async () => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.callNext();
    const salonId = state.salon?.id;
    const currentActive = state.queue.find((item) => item.status === 'in_progress');
    if (currentActive) await updateQueueEntry(currentActive.id, { status: 'done' });
    const nextEntry = state.queue.find((item) => item.status === 'next') || state.queue.find((item) => item.status === 'waiting');
    if (nextEntry) {
      await updateQueueEntry(nextEntry.id, { status: 'in_progress' });
      if (nextEntry.user_id) await sendNotification({ userId: nextEntry.user_id, tenantId: state.salon?.tenant_id, type: 'your_turn_next', message: `${nextEntry.customer_name}, your turn is next.` });
    }
    const following = state.queue.filter((item) => item.status === 'waiting' && item.id !== nextEntry?.id).sort((a, b) => a.position - b.position)[0];
    if (following) await updateQueueEntry(following.id, { status: 'next' });
    await resequenceQueue(undefined, salonId);
    await load();
    return { error: null };
  }, [load, sampleState, state.queue, state.salon, profile?.id]);

  const addWalkIn = useCallback(async ({ customerName, serviceName }) => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.addWalkIn({ customerName, serviceName });
    const salonId = state.salon?.id;
    const entry = await addToQueue({
      salon_id: salonId,
      tenant_id: state.salon?.tenant_id,
      owner_id: ownerId,
      customer_name: customerName,
      service_name: serviceName,
      staff_name: state.staff[0]?.name || 'Salon Team',
      status: 'waiting',
      position: (state.queue?.length || 0) + 1,
      estimated_wait_minutes: (state.queue?.length || 0) * 10,
    });
    await load();
    return entry;
  }, [load, sampleState, state.staff, state.queue, state.salon, profile?.id]);

  // ── Update salon settings ──
  const saveSalonSettings = useCallback(async (updates) => {
    const salonId = state.salon?.id;
    if (!isSupabaseConfigured || !salonId) return { error: null };
    const { data, error } = await updateSalon(salonId, updates);
    if (!error) await load();
    return { data, error };
  }, [load, state.salon]);

  useEffect(() => {
    load();
    const ownerId = profile?.id;
    const salonId = state.salon?.id;
    if (!isSupabaseConfigured || !ownerId) return undefined;
    const offQueue = subscribeToTenantTable({ table: 'queue', salonId, onChange: load });
    const offStaff = subscribeToTenantTable({ table: 'staff', salonId, onChange: load });
    return () => { offQueue?.(); offStaff?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, profile?.id]);

  const current = !isSupabaseConfigured ? sampleState : state;
  const metrics = useMemo(() => {
    const bookings = current.bookings || [];
    const queue = current.queue || [];
    const customers = current.customers || [];
    const revenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    return {
      revenue,
      bookings: bookings.length,
      queue: queue.filter((item) => ['waiting', 'in_progress', 'next'].includes(item.status)).length,
      rating: current.staff?.length ? (current.staff.reduce((sum, item) => sum + Number(item.rating || 0), 0) / current.staff.length).toFixed(1) : '4.8',
      customers: customers.length,
    };
  }, [current]);

  return {
    ...current,
    loading: !isSupabaseConfigured ? false : state.loading,
    error: !isSupabaseConfigured ? '' : state.error,
    needsSetup: !isSupabaseConfigured ? false : state.needsSetup,
    metrics,
    revenueSeries: computeRevenueSeries(current.bookings || []),
    peakHours: computePeakHours(current.bookings || []),
    callNext,
    addWalkIn,
    addStaff,
    updateStaff,
    deleteStaff,
    addService,
    editService,
    removeService,
    saveSalonSettings,
    mode: !isSupabaseConfigured ? 'sample' : 'live',
  };
}

// ─── Admin Dashboard Hook ─────────────────────────────────────────────────

export function useAdminDashboardData() {
  const [state, setState] = useState({ loading: isSupabaseConfigured, salons: [], subscriptions: [], auditLogs: [], error: '' });

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [salonsRes, subscriptionsRes] = await Promise.all([
        listSalons(),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      ]);
      const auditRes = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
      setState({
        loading: false,
        salons: salonsRes.data || [],
        subscriptions: subscriptionsRes.data || [],
        auditLogs: auditRes.data || [],
        error: salonsRes.error?.message || subscriptionsRes.error?.message || auditRes.error?.message || '',
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || 'Failed to load admin dashboard.' }));
    }
  }, []);

  useEffect(() => {
    load();
    if (!isSupabaseConfigured) return undefined;
    const offSalons = subscribeToTenantTable({ table: 'salons', onChange: load });
    return () => offSalons?.();
  }, [load]);

  const currentSalons = !isSupabaseConfigured ? sampleSalons : state.salons;
  const currentSubscriptions = !isSupabaseConfigured ? sampleSubscriptions : state.subscriptions;
  const auditLogs = !isSupabaseConfigured
    ? sampleNotifications.map((item) => ({ ...item, event: item.title, user: item.user_id, salon: item.tenant_id, ip: 'system', risk: 'low', time: new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }))
    : state.auditLogs.map((item) => ({ ...item, event: item.title, user: item.user_id, salon: item.tenant_id, ip: 'system', risk: item.type === 'security_alert' ? 'high' : 'low', time: new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }));

  const planStats = currentSubscriptions.reduce((acc, subscription) => {
    acc[subscription.plan] = (acc[subscription.plan] || 0) + 1;
    return acc;
  }, {});

  const growthSeries = currentSalons.map((salon, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr'][index] || `M${index + 1}`,
    salons: index + 1,
    mrr: currentSubscriptions.slice(0, index + 1).reduce((sum, subscription) => sum + Number(subscription.amount || 0), 0),
  }));

  return {
    loading: !isSupabaseConfigured ? false : state.loading,
    error: !isSupabaseConfigured ? '' : state.error,
    salons: currentSalons,
    subscriptions: currentSubscriptions,
    auditLogs,
    growthSeries,
    planStats: [
      { name: 'Basic', value: planStats.basic || 0 },
      { name: 'Pro', value: planStats.pro || 0 },
      { name: 'Enterprise', value: planStats.enterprise || 0 },
    ],
    totalMRR: currentSubscriptions.reduce((sum, subscription) => sum + Number(subscription.amount || 0), 0),
    mode: !isSupabaseConfigured ? 'sample' : 'live',
    reload: load,
  };
}

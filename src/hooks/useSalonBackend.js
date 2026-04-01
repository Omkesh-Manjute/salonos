import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addStaffMember,
  addToQueue,
  createBookingWithQueue,
  getQueueByTenant,
  isSupabaseConfigured,
  listBookings,
  listNotifications,
  listSalons,
  listServicesByTenant,
  listStaffByOwner,
  listUsersByTenant,
  resequenceQueue,
  subscribeToTenantTable,
  supabase,
  updateBookingStatus,
  updateQueueEntry,
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

function formatCurrency(amount) {
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

  const createBooking = useCallback(async ({ serviceId, staffName, bookingType, bookingTime, paymentMethod }) => {
    const service = services.find((item) => item.id === serviceId);
    const bookingId = `bkg-${Date.now()}`;
    const booking = {
      id: bookingId,
      tenant_id: tenantId,
      user_id: userId,
      service_id: service?.id,
      service_name: service?.name || 'Service',
      staff_name: staffName,
      booking_time: bookingTime,
      status: 'confirmed',
      booking_type: bookingType,
      payment_status: paymentMethod === 'Cash at Salon' ? 'pending' : 'paid',
      total_amount: Number(service?.price || 0),
    };
    setBookings((current) => [booking, ...current]);
    if (bookingType === 'queue') {
      setQueue((current) => [
        ...current,
        {
          id: `que-${Date.now()}`,
          tenant_id: tenantId,
          user_id: userId,
          customer_name: profile?.name || 'Customer',
          phone: profile?.phone || '',
          service_name: booking.service_name,
          staff_name: staffName,
          position: current.length + 1,
          estimated_wait_minutes: current.length * 10,
          status: 'waiting',
        },
      ]);
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
      return nextQueue
        .filter((entry) => entry.status !== 'done')
        .sort((a, b) => a.position - b.position)
        .map((entry, index) => ({ ...entry, position: index + 1, estimated_wait_minutes: index * 10 }));
    });
    return { error: null };
  }, []);

  const addWalkIn = useCallback(async ({ customerName, serviceName }) => {
    setQueue((current) => [
      ...current,
      {
        id: `que-${Date.now()}`,
        tenant_id: tenantId,
        user_id: null,
        customer_name: customerName,
        phone: '',
        service_name: serviceName,
        staff_name: staff[0]?.name || 'Team',
        position: current.length + 1,
        estimated_wait_minutes: current.length * 10,
        status: 'waiting',
      },
    ]);
    return { error: null };
  }, [staff, tenantId]);

  const addStaff = useCallback(async ({ name, specialty, experience, avatar_url }) => {
    const generatedId = crypto.randomUUID?.() || `stf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStaff = {
      id: generatedId,
      tenant_id: tenantId,
      name,
      specialty,
      experience,
      avatar: name?.charAt(0) || 'S',
      avatar_url,
      available: true,
      rating: 4.8,
      today_clients: 0,
    };
    setStaff((current) => [...current, newStaff]);
    return { data: newStaff, error: null };
  }, [tenantId]);

  const updateStaff = useCallback(async (id, updates) => {
    return { data: updates, error: null };
  }, []);

  const deleteStaff = useCallback(async (id) => {
    return { error: null };
  }, []);

  return { services, staff, customers, bookings, queue, notifications, salons, subscriptions, createBooking, callNext, addWalkIn, addStaff, updateStaff, deleteStaff };
}

export function useCustomerAppData(profile) {
  const sampleState = useSampleTenantState(profile);
  const tenantId = profile?.tenant_id;
  const userId = profile?.id;
  const [state, setState] = useState({
    loading: isSupabaseConfigured,
    services: [],
    staff: [],
    bookings: [],
    queue: [],
    notifications: [],
    error: '',
  });

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !tenantId || !userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
    try {
      const [servicesRes, bookingsRes, queueRes, notificationsRes] = await Promise.all([
        listServicesByTenant(tenantId),
        listBookings({ tenantId, userId }),
        getQueueByTenant(tenantId),
        listNotifications(userId),
      ]);

      const staffRes = await listUsersByTenant(tenantId);
      const staff = (staffRes.data || []).filter((item) => item.role !== 'customer').map((item) => ({
        id: item.id,
        name: item.name,
        specialty: item.metadata?.specialty || 'Salon Expert',
        rating: item.metadata?.rating || 4.8,
        experience: item.metadata?.experience || '5 yrs',
        available: item.metadata?.available ?? true,
        avatar: item.name?.charAt(0) || 'S',
      }));

      setState({
        loading: false,
        services: servicesRes.data || [],
        staff,
        bookings: bookingsRes.data || [],
        queue: queueRes.data || [],
        notifications: notificationsRes.data || [],
        error: servicesRes.error?.message || bookingsRes.error?.message || queueRes.error?.message || notificationsRes.error?.message || '',
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || 'Failed to load app data.' }));
    }
  }, [tenantId, userId]);

  useEffect(() => {
    load();
    if (!isSupabaseConfigured || !tenantId || !userId) return undefined;
    const offQueue = subscribeToTenantTable({ table: 'queue', tenantId, onChange: load });
    const offBookings = subscribeToTenantTable({ table: 'bookings', tenantId, onChange: load });
    return () => {
      offQueue?.();
      offBookings?.();
    };
  }, [load, tenantId, userId]);

  const createBooking = useCallback(async ({ serviceId, staffName, bookingType, bookingTime, paymentMethod }) => {
    if (!isSupabaseConfigured || !tenantId || !userId) {
      return sampleState.createBooking({ serviceId, staffName, bookingType, bookingTime, paymentMethod });
    }

    const service = state.services.find((item) => item.id === serviceId);
    const bookingPayload = {
      tenant_id: tenantId,
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
      tenant_id: tenantId,
      user_id: userId,
      customer_name: profile?.name || 'Customer',
      phone: profile?.phone || '',
      service_name: bookingPayload.service_name,
      staff_name: staffName,
      status: 'waiting',
    } : null;

    const response = await createBookingWithQueue({ booking: bookingPayload, queueEntry: queuePayload });
    if (!response.error) {
      await sendNotification({ userId, tenantId, type: 'booking_confirmed', message: `${bookingPayload.service_name} booked successfully.` });
      await load();
    }
    return response;
  }, [load, profile?.name, profile?.phone, state.services, tenantId, userId, sampleState]);

  if (!isSupabaseConfigured) {
    return { ...sampleState, loading: false, error: '', mode: 'sample' };
  }

  return { ...state, createBooking, mode: 'live' };
}

export function useOwnerDashboardData(profile) {
  const tenantId = profile?.tenant_id;
  const sampleState = useSampleTenantState(profile);
  const [state, setState] = useState({ loading: isSupabaseConfigured, services: [], staff: [], customers: [], bookings: [], queue: [], error: '' });

  const load = useCallback(async () => {
    const ownerId = profile?.id; // Firebase UID
    if (!isSupabaseConfigured || !ownerId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    try {
      // Prioritize ownerId for scoping, tenantId is secondary
      const [servicesRes, customersRes, bookingsRes, queueRes, staffRes] = await Promise.all([
        tenantId ? listServicesByTenant(tenantId) : Promise.resolve({ data: [] }),
        tenantId ? listUsersByTenant(tenantId, 'customer') : Promise.resolve({ data: [] }),
        listBookings({ tenantId, ownerId }),
        getQueueByTenant(tenantId, ownerId),
        listStaffByOwner(ownerId),
      ]);

      const staff = (staffRes.data || [])
        .map((item) => ({
          id: item.id,
          name: item.name,
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
        error: (servicesRes.error?.message || customersRes.error?.message || bookingsRes.error?.message || queueRes.error?.message || staffRes.error?.message) || '',
      });
    } catch (error) {
      console.log("ERROR loading dashboard:", error);
      setState((current) => ({ ...current, loading: false, error: error.message || 'Failed to load owner dashboard.' }));
    }
  }, [tenantId, profile?.id]);

  const addStaff = useCallback(async ({ name, specialty, experience, avatar_url }) => {
    const ownerId = profile?.id; // Firebase UID
    if (!isSupabaseConfigured || !ownerId) return sampleState.addStaff({ name, specialty, experience, avatar_url });
    if (!ownerId) {
      console.log("ERROR: No owner_id (user.uid) found");
      return { error: { message: 'Owner ID missing' } };
    }

    try {
      const { data: newStaff, error } = await addStaffMember({
        owner_id: ownerId,
        name,
        specialty,
        experience,
        avatar_url,
      });
      
      if (error) {
        console.log("ERROR adding staff:", error);
        return { data: null, error };
      }
      
      await load();
      return { data: newStaff, error: null };
    } catch (err) {
      console.log("UNEXPECTED ERROR in addStaff:", err);
      return { data: null, error: err };
    }
  }, [load, sampleState, tenantId, profile?.id]);

  const updateStaff = useCallback(async (id, updates) => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.updateStaff(id, updates);
    
    const { data, error } = await supabase.from('staff').update({
      name: updates.name,
      specialty: updates.specialty,
      experience: updates.experience,
      avatar_url: updates.avatar_url,
      available: updates.available,
      rating: updates.rating,
      today_clients: updates.today_clients
    }).eq('id', id).select().single();
    
    if (error) console.log("ERROR updating staff:", error);
    if (!error) await load();
    return { data, error };
  }, [load, sampleState, profile?.id]);

  const deleteStaff = useCallback(async (id) => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.deleteStaff(id);
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) console.log("ERROR deleting staff:", error);
    if (!error) await load();
    return { error };
  }, [load, sampleState, profile?.id]);

  useEffect(() => {
    load();
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return undefined;
    
    // Subscribe to all relevant tables. Changes will trigger 'load' which handles filtering.
    const offQueue = subscribeToTenantTable({ table: 'queue', tenantId, onChange: load });
    const offBookings = subscribeToTenantTable({ table: 'bookings', tenantId, onChange: load });
    const offStaff = subscribeToTenantTable({ table: 'staff', onChange: load }); // Listening to all staff changes
    
    return () => {
      offQueue?.();
      offBookings?.();
      offStaff?.();
    };
  }, [load, tenantId, profile?.id]);

  const callNext = useCallback(async () => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.callNext();
    const currentActive = state.queue.find((item) => item.status === 'in_progress');
    if (currentActive) await updateQueueEntry(currentActive.id, { status: 'done' });
    const nextQueue = state.queue.find((item) => item.status === 'next') || state.queue.find((item) => item.status === 'waiting');
    if (nextQueue) {
      await updateQueueEntry(nextQueue.id, { status: 'in_progress' });
      if (nextQueue.user_id) {
        await sendNotification({ userId: nextQueue.user_id, tenantId, type: 'your_turn_next', message: `${nextQueue.customer_name}, your turn is next.` });
      }
    }
    const following = state.queue.filter((item) => item.status === 'waiting' && item.id !== nextQueue?.id).sort((a, b) => a.position - b.position)[0];
    if (following) await updateQueueEntry(following.id, { status: 'next' });
    await resequenceQueue(tenantId);
    await load();
    return { error: null };
  }, [load, sampleState, state.queue, tenantId]);

  const addWalkIn = useCallback(async ({ customerName, serviceName }) => {
    const ownerId = profile?.id;
    if (!isSupabaseConfigured || !ownerId) return sampleState.addWalkIn({ customerName, serviceName });
    const entry = await addToQueue({ 
      tenant_id: tenantId, 
      owner_id: ownerId,
      customer_name: customerName, 
      service_name: serviceName, 
      staff_name: state.staff[0]?.name || 'Salon Team', 
      status: 'waiting' 
    });
    await load();
    return entry;
  }, [load, sampleState, state.staff, tenantId, profile?.id]);

  const current = !isSupabaseConfigured ? sampleState : state;
  const metrics = useMemo(() => {
    const bookings = current.bookings || [];
    const queue = current.queue || [];
    const customers = current.customers || [];
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
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
    metrics,
    revenueSeries: computeRevenueSeries(current.bookings || []),
    peakHours: computePeakHours(current.bookings || []),
    callNext,
    addWalkIn,
    addStaff,
    updateStaff,
    deleteStaff,
    mode: !isSupabaseConfigured ? 'sample' : 'live',
  };
}

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
  };
}

export { formatCurrency };

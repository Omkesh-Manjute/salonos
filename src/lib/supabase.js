import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export const isSupabaseConfigured = !supabaseUrl.includes('demo.supabase.co') && supabaseAnonKey !== 'demo-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export async function signUpWithEmail(email, password, meta = {}) {
  return supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      data: meta,
      emailRedirectTo: window.location.origin
    } 
  });
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function sendOtp(phone) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifyOtp(phone, token) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getUserProfile(userId) {
  return supabase.from('users').select('*').eq('id', userId).single();
}

export async function createUserProfile(profile) {
  return supabase.from('users').insert(profile).select().single();
}

export async function updateUserProfile(userId, updates) {
  return supabase.from('users').update(updates).eq('id', userId).select().single();
}

export async function createSalon(data) {
  return supabase.from('salons').insert(data).select().single();
}

export async function getSalonById(id) {
  return supabase.from('salons').select('*').eq('id', id).single();
}

export async function listSalons() {
  return supabase.from('salons').select('*').order('created_at', { ascending: false });
}

export async function listServicesByTenant(tenantId) {
  return supabase.from('services').select('*').eq('tenant_id', tenantId).eq('active', true).order('name');
}

export async function createBooking(booking) {
  return supabase.from('bookings').insert(booking).select().single();
}

export async function listBookings({ tenantId, userId, limit } = {}) {
  let query = supabase.from('bookings').select('*').order('booking_time', { ascending: true });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (userId) query = query.eq('user_id', userId);
  if (limit) query = query.limit(limit);
  return query;
}

export async function getBookingsByTenant(tenantId) {
  return listBookings({ tenantId });
}

export async function updateBookingStatus(id, status) {
  return supabase.from('bookings').update({ status }).eq('id', id).select().single();
}

export async function getQueueByTenant(tenantId) {
  return supabase.from('queue').select('*').eq('tenant_id', tenantId).order('position', { ascending: true });
}

export async function addToQueue(entry) {
  return supabase.from('queue').insert(entry).select().single();
}

export async function updateQueueEntry(id, updates) {
  return supabase.from('queue').update(updates).eq('id', id).select().single();
}

export async function resequenceQueue(tenantId) {
  const { data, error } = await getQueueByTenant(tenantId);
  if (error || !data) return { data, error };
  const updates = data
    .filter((item) => ['waiting', 'in_progress', 'next'].includes(item.status))
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({ id: item.id, position: index + 1 }));
  const results = await Promise.all(updates.map((item) => updateQueueEntry(item.id, { position: item.position })));
  return { data: results, error: null };
}

export async function createBookingWithQueue({ booking, queueEntry }) {
  const { data: bookingRow, error: bookingError } = await createBooking(booking);
  if (bookingError) return { data: null, error: bookingError };

  if (!queueEntry) return { data: bookingRow, error: null };

  const { data: queueRow, error: queueError } = await addToQueue({ ...queueEntry, booking_id: bookingRow.id });
  return { data: { booking: bookingRow, queue: queueRow }, error: queueError };
}

export async function listNotifications(userId) {
  return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export async function markNotificationRead(id) {
  return supabase.from('notifications').update({ read_status: true }).eq('id', id).select().single();
}

export async function listUsersByTenant(tenantId, role) {
  let query = supabase.from('users').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  return query;
}

export async function upsertSubscription(data) {
  return supabase.from('subscriptions').upsert(data, { onConflict: 'tenant_id' }).select().single();
}

export function subscribeToTenantTable({ table, tenantId, onChange, filter }) {
  const topic = [`salonos`, table, tenantId || 'all', filter || 'all', Date.now()].join('-');
  let channel = supabase.channel(topic);
  channel = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      filter: filter || (tenantId ? `tenant_id=eq.${tenantId}` : undefined),
    },
    onChange,
  );
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

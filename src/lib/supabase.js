import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export const isSupabaseConfigured = !supabaseUrl.includes('demo.supabase.co') && supabaseAnonKey !== 'demo-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function createUserProfile(profile) {
  const { data, error } = await supabase.from('users').insert(profile).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function createSalon(data) {
  const { data: result, error } = await supabase.from('salons').insert(data).select().single();
  if (error) console.log("ERROR:", error);
  return { data: result, error };
}

export async function getSalonById(id) {
  const { data, error } = await supabase.from('salons').select('*').eq('id', id).single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function getSalonByTenant(tenantId) {
  const { data, error } = await supabase.from('salons').select('*').eq('tenant_id', tenantId).single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listSalons() {
  const { data, error } = await supabase.from('salons').select('*').order('created_at', { ascending: false });
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function getSalonsByOwner(ownerId) {
  const { data, error } = await supabase.from('salons').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listServicesByTenant(tenantId) {
  const { data, error } = await supabase.from('services').select('*').eq('tenant_id', tenantId).eq('active', true).order('name');
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function createBooking(booking) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listBookings({ tenantId, userId, ownerId, limit } = {}) {
  let query = supabase.from('bookings').select('*').order('booking_time', { ascending: true });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (userId) query = query.eq('user_id', userId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  if (limit) query = query.limit(limit);
  
  const { data, error } = await query;
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function getBookingsByTenant(tenantId) {
  return listBookings({ tenantId });
}

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function getQueueByTenant(tenantId, ownerId) {
  let query = supabase.from('queue').select('*').order('position', { ascending: true });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  
  const { data, error } = await query;
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function addToQueue(entry) {
  const { data, error } = await supabase.from('queue').insert(entry).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function updateQueueEntry(id, updates) {
  const { data, error } = await supabase.from('queue').update(updates).eq('id', id).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
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
  const { data, error } = await supabase.from('notifications').update({ read_status: true }).eq('id', id).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listStaffByOwner(ownerId) {
  const { data, error } = await supabase.from('staff').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function addStaffMember(staffData) {
  const { data, error } = await supabase.from('staff').insert(staffData).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listUsersByTenant(tenantId, role) {
  let query = supabase.from('users').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  
  const { data, error } = await query;
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function upsertSubscription(data) {
  const { data: result, error } = await supabase.from('subscriptions').upsert(data, { onConflict: 'tenant_id' }).select().single();
  if (error) console.log("ERROR:", error);
  return { data: result, error };
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

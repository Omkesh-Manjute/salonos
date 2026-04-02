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

export async function getSalonBySlug(slug) {
  const { data, error } = await supabase.from('salons').select('*').eq('slug', slug).single();
  if (error) console.log("ERROR getSalonBySlug:", error);
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

export async function updateSalon(id, updates) {
  const { data, error } = await supabase.from('salons').update(updates).eq('id', id).select().single();
  if (error) console.log("ERROR updateSalon:", error);
  return { data, error };
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export async function listStaffBySalonId(salonId) {
  const { data, error } = await supabase.from('staff').select('*').eq('salon_id', salonId).order('created_at', { ascending: false });
  if (error) console.log("ERROR listStaffBySalonId:", error);
  return { data, error };
}

// Robust: finds staff by salon_id OR owner_id (fallback for legacy data)
export async function listStaffForSalon(salonId, ownerId) {
  if (!salonId && !ownerId) return { data: [], error: null };
  let query = supabase.from('staff').select('*');
  if (salonId && ownerId) {
    query = query.or(`salon_id.eq.${salonId},owner_id.eq.${ownerId}`);
  } else if (salonId) {
    query = query.eq('salon_id', salonId);
  } else {
    query = query.eq('owner_id', ownerId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) console.log('ERROR listStaffForSalon:', error);
  // Deduplicate by id (OR query can return duplicates)
  const seen = new Set();
  return { data: (data || []).filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }), error };
}

// ─── Services ───────────────────────────────────────────────────────────────

export async function listServicesByTenant(tenantId) {
  const { data, error } = await supabase.from('services').select('*').eq('tenant_id', tenantId).eq('active', true).order('name');
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listServicesBySalonId(salonId) {
  const { data, error } = await supabase.from('services').select('*').eq('salon_id', salonId).eq('active', true).order('name');
  if (error) console.log("ERROR listServicesBySalonId:", error);
  return { data, error };
}

// Robust: finds services by salon_id OR tenant_id (fallback for legacy data)
export async function listServicesForSalon(salonId, tenantId) {
  if (!salonId && !tenantId) return { data: [], error: null };
  let query = supabase.from('services').select('*').eq('active', true).order('name');
  if (salonId && tenantId) {
    query = query.or(`salon_id.eq.${salonId},tenant_id.eq.${tenantId}`);
  } else if (salonId) {
    query = query.eq('salon_id', salonId);
  } else {
    query = query.eq('tenant_id', tenantId);
  }
  const { data, error } = await query;
  if (error) console.log('ERROR listServicesForSalon:', error);
  // Deduplicate
  const seen = new Set();
  return { data: (data || []).filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }), error };
}

export async function createService(data) {
  const { data: result, error } = await supabase.from('services').insert(data).select().single();
  if (error) console.log("ERROR createService:", error);
  return { data: result, error };
}

export async function updateService(id, updates) {
  const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
  if (error) console.log("ERROR updateService:", error);
  return { data, error };
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) console.log("ERROR deleteService:", error);
  return { error };
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function createBooking(booking) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listBookings({ tenantId, userId, ownerId, salonId, limit } = {}) {
  let query = supabase.from('bookings').select('*').order('booking_time', { ascending: true });
  if (salonId) query = query.eq('salon_id', salonId);
  else if (tenantId) query = query.eq('tenant_id', tenantId);
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

// ─── Queue ──────────────────────────────────────────────────────────────────

export async function getQueueByTenant(tenantId, ownerId) {
  let query = supabase.from('queue').select('*').order('position', { ascending: true });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (ownerId) query = query.eq('owner_id', ownerId);
  
  const { data, error } = await query;
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function getQueueBySalonId(salonId) {
  const { data, error } = await supabase.from('queue').select('*').eq('salon_id', salonId).order('position', { ascending: true });
  if (error) console.log("ERROR getQueueBySalonId:", error);
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

export async function resequenceQueue(tenantId, salonId) {
  const { data, error } = salonId ? await getQueueBySalonId(salonId) : await getQueueByTenant(tenantId);
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

// ─── Notifications ──────────────────────────────────────────────────────────

export async function listNotifications(userId) {
  return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export async function markNotificationRead(id) {
  const { data, error } = await supabase.from('notifications').update({ read_status: true }).eq('id', id).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

// ─── Staff (legacy helpers) ─────────────────────────────────────────────────

export async function listStaffByOwner(ownerId) {
  const { data, error } = await supabase.from('staff').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function listStaffByTenant(tenantId) {
  const { data, error } = await supabase.from('staff').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error) console.log("ERROR:", error);
  return { data, error };
}

export async function addStaffMember(staffData) {
  const { data, error } = await supabase.from('staff').insert(staffData).select().single();
  if (error) console.log("ERROR:", error);
  return { data, error };
}

// ─── Users / CRM ────────────────────────────────────────────────────────────

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

// ─── Realtime ───────────────────────────────────────────────────────────────

export function subscribeToTenantTable({ table, tenantId, salonId, onChange, filter }) {
  const topic = [`salonos`, table, salonId || tenantId || 'all', filter || 'all', Date.now()].join('-');
  let channel = supabase.channel(topic);
  const resolvedFilter = filter || (salonId ? `salon_id=eq.${salonId}` : tenantId ? `tenant_id=eq.${tenantId}` : undefined);
  channel = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      filter: resolvedFilter,
    },
    onChange,
  );
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

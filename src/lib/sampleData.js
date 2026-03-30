export const sampleServices = [
  { id: 'svc-1', tenant_id: 'tenant-sams-creation', name: 'Haircut', category: 'Hair', description: 'Classic precision haircut', duration_minutes: 30, price: 200, is_popular: true, active: true },
  { id: 'svc-2', tenant_id: 'tenant-sams-creation', name: 'Hair Color', category: 'Hair', description: 'Full color with premium finish', duration_minutes: 90, price: 800, is_popular: false, active: true },
  { id: 'svc-3', tenant_id: 'tenant-sams-creation', name: 'Beard Trim', category: 'Grooming', description: 'Sharp beard detailing', duration_minutes: 20, price: 100, is_popular: true, active: true },
  { id: 'svc-4', tenant_id: 'tenant-sams-creation', name: 'Facial', category: 'Skin', description: 'Deep clean facial session', duration_minutes: 60, price: 600, is_popular: false, active: true },
  { id: 'svc-5', tenant_id: 'tenant-sams-creation', name: 'Hair Spa', category: 'Hair', description: 'Repair and hydration spa', duration_minutes: 45, price: 500, is_popular: true, active: true },
];

export const sampleStaff = [
  { id: 'stf-1', tenant_id: 'tenant-sams-creation', name: 'Ravi Kumar', specialty: 'Hair & Color', rating: 4.9, experience: '8 yrs', available: true, today_clients: 8, avatar: 'R' },
  { id: 'stf-2', tenant_id: 'tenant-sams-creation', name: 'Priya Sharma', specialty: 'Skin & Facial', rating: 4.8, experience: '6 yrs', available: true, today_clients: 5, avatar: 'P' },
  { id: 'stf-3', tenant_id: 'tenant-sams-creation', name: 'Amit Singh', specialty: 'Grooming', rating: 4.7, experience: '5 yrs', available: false, today_clients: 6, avatar: 'A' },
  { id: 'stf-4', tenant_id: 'tenant-sams-creation', name: 'Neha Patel', specialty: 'Hair Spa', rating: 4.9, experience: '7 yrs', available: true, today_clients: 7, avatar: 'N' },
];

export const sampleCustomers = [
  { id: 'usr-c-1', tenant_id: 'tenant-sams-creation', name: 'Priya Customer', phone: '+919876543210', email: 'priya@example.com', loyalty_points: 120, visits: 12, spend: 6400, last_visit: '2026-03-24T10:00:00Z' },
  { id: 'usr-c-2', tenant_id: 'tenant-sams-creation', name: 'Rahul Mehta', phone: '+919812345678', email: 'rahul@example.com', loyalty_points: 70, visits: 7, spend: 3200, last_visit: '2026-03-27T09:30:00Z' },
  { id: 'usr-c-3', tenant_id: 'tenant-sams-creation', name: 'Kavya Rao', phone: '+919845612378', email: 'kavya@example.com', loyalty_points: 180, visits: 18, spend: 9100, last_visit: '2026-03-20T12:30:00Z' },
];

export const sampleBookings = [
  { id: 'bkg-1', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-1', service_id: 'svc-5', service_name: 'Hair Spa', staff_name: 'Neha Patel', booking_time: '2026-03-28T14:00:00Z', status: 'confirmed', booking_type: 'slot', payment_status: 'paid', total_amount: 500 },
  { id: 'bkg-2', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-2', service_id: 'svc-1', service_name: 'Haircut', staff_name: 'Ravi Kumar', booking_time: '2026-03-28T10:00:00Z', status: 'completed', booking_type: 'slot', payment_status: 'paid', total_amount: 200 },
  { id: 'bkg-3', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-3', service_id: 'svc-4', service_name: 'Facial', staff_name: 'Priya Sharma', booking_time: '2026-03-29T11:30:00Z', status: 'confirmed', booking_type: 'slot', payment_status: 'pending', total_amount: 600 },
  { id: 'bkg-4', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-2', service_id: 'svc-2', service_name: 'Hair Color', staff_name: 'Ravi Kumar', booking_time: '2026-03-26T15:00:00Z', status: 'completed', booking_type: 'slot', payment_status: 'paid', total_amount: 800 },
];

export const sampleQueue = [
  { id: 'que-1', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-2', customer_name: 'Rahul Mehta', phone: '+919812345678', service_name: 'Haircut', staff_name: 'Ravi Kumar', position: 1, estimated_wait_minutes: 0, status: 'in_progress' },
  { id: 'que-2', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-3', customer_name: 'Kavya Rao', phone: '+919845612378', service_name: 'Facial', staff_name: 'Priya Sharma', position: 2, estimated_wait_minutes: 15, status: 'waiting' },
  { id: 'que-3', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-1', customer_name: 'Priya Customer', phone: '+919876543210', service_name: 'Hair Spa', staff_name: 'Neha Patel', position: 3, estimated_wait_minutes: 25, status: 'next' },
  { id: 'que-4', tenant_id: 'tenant-sams-creation', user_id: null, customer_name: 'Walk-in Guest', phone: '', service_name: 'Beard Trim', staff_name: 'Amit Singh', position: 4, estimated_wait_minutes: 35, status: 'waiting' },
];

export const sampleSalons = [
  { id: 'sal-1', tenant_id: 'tenant-sams-creation', name: "Sam's Creation", owner_name: 'Aurangzeb Alamgir', email: 'owner@samscreation.in', phone: '+919800000001', city: 'Gondia', plan: 'pro', status: 'active', joined: '2026-01-10', revenue: 124000, bookings: 284 },
  { id: 'sal-2', tenant_id: 'tenant-stylehub', name: 'Style Hub', owner_name: 'Priya Mehra', email: 'owner@stylehub.in', phone: '+919800000002', city: 'Delhi', plan: 'basic', status: 'active', joined: '2026-02-15', revenue: 28305, bookings: 95 },
  { id: 'sal-3', tenant_id: 'tenant-groomzone', name: 'GroomZone', owner_name: 'Suresh Yadav', email: 'owner@groomzone.in', phone: '+919800000003', city: 'Mumbai', plan: 'pro', status: 'active', joined: '2026-02-20', revenue: 71200, bookings: 178 },
  { id: 'sal-4', tenant_id: 'tenant-luxurycuts', name: 'Luxury Cuts', owner_name: 'Anjali Singh', email: 'owner@luxurycuts.in', phone: '+919800000004', city: 'Bangalore', plan: 'basic', status: 'pending', joined: '2026-03-01', revenue: 0, bookings: 0 },
];

export const sampleSubscriptions = [
  { tenant_id: 'tenant-sams-creation', plan: 'pro', status: 'active', trial_ends_at: '2026-01-24T00:00:00Z', current_period_end: '2026-04-15T00:00:00Z', amount: 1499 },
  { tenant_id: 'tenant-stylehub', plan: 'basic', status: 'active', trial_ends_at: '2026-02-28T00:00:00Z', current_period_end: '2026-04-18T00:00:00Z', amount: 999 },
  { tenant_id: 'tenant-groomzone', plan: 'pro', status: 'trial', trial_ends_at: '2026-04-02T00:00:00Z', current_period_end: null, amount: 1499 },
];

export const sampleNotifications = [
  { id: 'not-1', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-1', title: 'Booking confirmed', message: 'Your Hair Spa booking is confirmed for 2:00 PM.', type: 'booking_confirmed', read_status: false, created_at: '2026-03-28T08:00:00Z' },
  { id: 'not-2', tenant_id: 'tenant-sams-creation', user_id: 'usr-c-1', title: 'Your turn is next', message: 'Please head to the salon. You are next in queue.', type: 'your_turn_next', read_status: false, created_at: '2026-03-28T09:00:00Z' },
];

export function cloneSample(value) {
  return JSON.parse(JSON.stringify(value));
}

export const DEMO_AUTH_STORAGE_KEY = 'salonos_demo_auth';

export function readDemoSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDemoSession(session) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}

export function createDemoSession(role, overrides = {}) {
  const nameMap = {
    customer: 'Priya Customer',
    owner: 'Aurangzeb Alamgir',
    admin: 'Super Admin',
  };

  return {
    user: {
      id: overrides.id || `demo-${role}`,
      email: overrides.email || (role === 'customer' ? 'customer@demo.salonos.in' : `${role}@demo.salonos.in`),
      phone: overrides.phone || (role === 'customer' ? '+919876543210' : ''),
      user_metadata: {
        name: overrides.name || nameMap[role] || 'Demo User',
      },
    },
    profile: {
      id: overrides.id || `demo-${role}`,
      name: overrides.name || nameMap[role] || 'Demo User',
      email: overrides.email || (role === 'customer' ? 'customer@demo.salonos.in' : `${role}@demo.salonos.in`),
      phone: overrides.phone || (role === 'customer' ? '+919876543210' : ''),
      role,
      tenant_id: overrides.tenant_id || (role === 'customer' ? 'tenant-sams-creation' : role === 'owner' ? 'tenant-sams-creation' : 'platform-admin'),
      demo: true,
      ...overrides,
    },
  };
}

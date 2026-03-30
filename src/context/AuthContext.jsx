import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, isSupabaseConfigured } from '../lib/supabase';
import { auth, onAuthStateChanged, requestNotificationPermission, signOutFirebase } from '../lib/firebase';
import { clearDemoSession, createDemoSession, readDemoSession, writeDemoSession } from '../lib/demoAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const applyDemoSession = useCallback((session) => {
    setUser(session?.user ?? null);
    setProfile(session?.profile ?? null);
  }, []);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    if (!isSupabaseConfigured) {
      const cachedDemo = readDemoSession();
      if (cachedDemo) applyDemoSession(cachedDemo);
      return;
    }

    // Normalized ID (Firebase: uid)
    const userId = authUser.uid;
    const { data, error } = await getUserProfile(userId);

    if (error || !data) {
      // Create new profile if not found
      const phone = authUser.phoneNumber || authUser.phone || '';
      const email = authUser.email || '';
      // Simple role logic: email with @salonos-admin.in is admin, everything else is customer by default
      const role = email.endsWith('@salonos-admin.in') ? 'admin' : 'customer';

      const { data: newProfile, error: createError } = await createUserProfile({
        id: userId,
        name: authUser.displayName || authUser.user_metadata?.name || phone || email || 'New User',
        phone,
        email,
        role,
        tenant_id: null,
      });
      
      if (!createError) {
        setProfile(newProfile);
      }
    } else {
      setProfile(data);
      requestNotificationPermission(userId).catch(() => {});
    }
  }, [applyDemoSession]);

  useEffect(() => {
    const cachedDemo = readDemoSession();

    if (!isSupabaseConfigured) {
      applyDemoSession(cachedDemo);
      setLoading(false);
      setInitialized(true);
      return undefined;
    }

    let active = true;

    // Direct Firebase Auth Listener (No Supabase Auth)
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      
      if (firebaseUser) {
        clearDemoSession();
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
      } else {
        const demo = readDemoSession();
        applyDemoSession(demo);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      active = false;
      unsubscribeFirebase();
    };
  }, [applyDemoSession, loadProfile]);

  const isCustomer = profile?.role === 'customer';
  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin';
  const tenantId = profile?.tenant_id;
  const role = profile?.role;

  function defaultPathForRole(currentRole) {
    if (currentRole === 'admin') return '/admin';
    if (currentRole === 'owner') return '/dashboard';
    return '/app';
  }

  async function signOut() {
    clearDemoSession();
    if (isSupabaseConfigured) {
      await signOutFirebase();
    }
    setUser(null);
    setProfile(null);
  }

  async function attachTenant(nextTenantId) {
    const userId = user?.uid; // Normalize UID
    if (!userId) return;

    if (profile?.demo) {
      const session = createDemoSession('owner', { ...profile, tenant_id: nextTenantId });
      writeDemoSession(session);
      applyDemoSession(session);
      return;
    }

    const { data } = await supabase
      .from('users')
      .update({ tenant_id: nextTenantId, role: 'owner' })
      .eq('id', userId)
      .select()
      .single();
    setProfile(data);
  }

  async function startDemoSession(nextRole, overrides = {}) {
    const session = createDemoSession(nextRole, overrides);
    writeDemoSession(session);
    applyDemoSession(session);
    setLoading(false);
    setInitialized(true);
    return session;
  }

  const value = {
    user,
    profile,
    loading,
    initialized,
    isCustomer,
    isOwner,
    isAdmin,
    tenantId,
    role,
    signOut,
    attachTenant,
    startDemoSession,
    refreshProfile: () => (user ? loadProfile(user) : Promise.resolve()),
    defaultPathForRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

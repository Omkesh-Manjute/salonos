import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, isSupabaseConfigured } from '../lib/supabase';
import { requestNotificationPermission } from '../lib/firebase';
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

    const { data, error } = await getUserProfile(authUser.id);

    if (error || !data) {
      const phone = authUser.phone || '';
      const email = authUser.email || '';
      const role = email.endsWith('@salonos-admin.in') ? 'admin' : 'customer';

      const { data: newProfile } = await createUserProfile({
        id: authUser.id,
        name: authUser.user_metadata?.name || phone || email,
        phone,
        email,
        role,
        tenant_id: null,
      });
      setProfile(newProfile);
    } else {
      setProfile(data);
      requestNotificationPermission(authUser.id).catch(() => {});
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;

      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user).finally(() => {
          if (!active) return;
          setLoading(false);
          setInitialized(true);
        });
        return;
      }

      if (cachedDemo) {
        applyDemoSession(cachedDemo);
      }

      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        clearDemoSession();
        setUser(session.user);
        await loadProfile(session.user);
      } else {
        const demo = readDemoSession();
        applyDemoSession(demo);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
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
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }

  async function attachTenant(nextTenantId) {
    if (!user) return;

    if (profile?.demo) {
      const session = createDemoSession('owner', { ...profile, tenant_id: nextTenantId });
      writeDemoSession(session);
      applyDemoSession(session);
      return;
    }

    const { data } = await supabase
      .from('users')
      .update({ tenant_id: nextTenantId, role: 'owner' })
      .eq('id', user.id)
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

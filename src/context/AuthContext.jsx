import { createContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, isSupabaseConfigured, signOut as supaSignOut } from '../lib/supabase';
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

    try {
      const { data, error } = await getUserProfile(authUser.id);

      if (error || !data) {
        // Only attempt create if the record actually doesn't exist
        const phone = authUser.phone || '';
        const email = authUser.email || '';
        const role = email.endsWith('@salonos-admin.in') ? 'admin' : 'customer';

        const { data: newProfile, error: createError } = await createUserProfile({
          id: authUser.id,
          name: authUser.user_metadata?.name || phone || email,
          phone,
          email,
          role,
          tenant_id: null,
        });
        
        if (createError && !createError.message.includes('duplicate key')) {
          console.error('Profile creation error:', createError);
        }
        setProfile(newProfile || data); // Use data if newProfile is null due to duplicate
      } else {
        setProfile(data);
        requestNotificationPermission(authUser.id).catch(() => {});
      }
    } catch (err) {
      console.error('Critical Profile Load Error:', err);
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
        try {
          const profilePromise = loadProfile(session.user);
          const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
          await Promise.race([profilePromise, timeoutPromise]);
        } catch (e) {
          console.error('Auth state change profile load error:', e);
        } finally {
          if (active) {
            setLoading(false);
            setInitialized(true);
          }
        }
      } else {
        const demo = readDemoSession();
        applyDemoSession(demo);
        setLoading(false);
        setInitialized(true);
      }
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
  const onboardingCompleted = profile?.onboarding_completed;
  const isCustomerOnboardingRequired = profile?.role === 'customer' && !profile?.onboarding_completed;
  const isOwnerOnboardingRequired = profile?.role === 'owner' && !profile?.tenant_id;
  const isOnboardingRequired = isCustomerOnboardingRequired || isOwnerOnboardingRequired;

  function defaultPathForRole(currentRole) {
    if (currentRole === 'admin') return '/admin';
    if (currentRole === 'owner') return '/dashboard';
    return '/app';
  }

  async function signOut() {
    clearDemoSession();
    if (isSupabaseConfigured) {
      await supaSignOut();
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
    onboardingCompleted,
    isOnboardingRequired,
    isCustomerOnboardingRequired,
    isOwnerOnboardingRequired,
    signOut,
    attachTenant,
    startDemoSession,
    refreshProfile: () => (user ? loadProfile(user) : Promise.resolve()),
    defaultPathForRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


// useAuth hook is now in src/hooks/useAuth.js

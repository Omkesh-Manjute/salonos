import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getUserProfile, createUserProfile, isSupabaseConfigured } from '../lib/supabase';
import { auth, onAuthStateChanged, requestNotificationPermission, signOutFirebase } from '../lib/firebase';
import { clearDemoSession, createDemoSession, readDemoSession, writeDemoSession } from '../lib/demoAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Ref to persist the intended login role across async boundaries
  // This prevents onAuthStateChanged from overwriting the role to 'customer'
  const pendingRoleRef = useRef(null);

  const applyDemoSession = useCallback((session) => {
    setUser(session?.user ?? null);
    setProfile(session?.profile ?? null);
  }, []);

  const loadProfile = useCallback(async (authUser, intendedRole = null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    
    // Normalized ID (Firebase: uid)
    const userId = authUser.uid;
    const phone = authUser.phoneNumber || authUser.phone || '';
    const email = authUser.email || '';
    const name = authUser.displayName || authUser.user_metadata?.name || phone || email || 'New User';
    
    // Simple role logic: 
    // 1. Specified Admin email
    // 2. Intended Role from the portal (Login/Sign-up)
    // 3. Defaults to 'customer'
    let role = 'customer';
    if (email.endsWith('@salonos-admin.in')) role = 'admin';
    else if (intendedRole) role = intendedRole;

    if (!isSupabaseConfigured) {
      const cachedDemo = readDemoSession();
      if (cachedDemo) {
        applyDemoSession(cachedDemo);
      } else {
        // Fallback: Use Firebase data as the profile if Supabase is not connected
        setProfile({
          id: userId,
          name,
          phone,
          email,
          role,
          tenant_id: null,
          is_demo: false,
        });
      }
      return;
    }

    const { data: profileData, error: profileError } = await getUserProfile(userId);

    if (profileError || !profileData) {
      const { data: newProfile, error: createError } = await createUserProfile({
        id: userId,
        name,
        phone,
        email,
        role,
        tenant_id: null,
      });
      
      if (!createError && newProfile) {
        setProfile(newProfile);
      } else {
        // Final fallback if Supabase insertion fails
        setProfile({ id: userId, name, phone, email, role, tenant_id: null });
      }
    } else {
      // If logging in from a role portal but have a different role, 
      // automatically update the role to match the portal they are using.
      // This fixes the issue where an owner with a 'customer' role is stuck.
      if (intendedRole && profileData.role !== intendedRole) {
        const { data: updatedProfile } = await supabase
          .from('users')
          .update({ role: intendedRole })
          .eq('id', userId)
          .select()
          .single();
        setProfile(updatedProfile || { ...profileData, role: intendedRole });
      } else {
        setProfile(profileData);
      }
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
        // Use the pending role if one was set by refreshProfile during login,
        // so we don't default to 'customer' and break admin/owner logins
        const roleForInit = pendingRoleRef.current;
        pendingRoleRef.current = null; // consume it once
        await loadProfile(firebaseUser, roleForInit);
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
    refreshProfile: (forcedRole = null) => {
      // Store the role in the ref so onAuthStateChanged can pick it up
      if (forcedRole) pendingRoleRef.current = forcedRole;
      return user ? loadProfile(user, forcedRole) : Promise.resolve();
    },
    // Allow login pages to set the intended role BEFORE calling auth methods
    // so onAuthStateChanged picks it up even if it fires before refreshProfile
    setPendingRole: (r) => { pendingRoleRef.current = r; },
    defaultPathForRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

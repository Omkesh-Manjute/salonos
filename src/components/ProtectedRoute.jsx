import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only users with the required role can access it.
 * Unauthenticated users are sent to the login page for that role.
 * Authenticated users with the wrong role are sent to their correct home.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading, defaultPathForRole, isCustomerOnboardingRequired, isOwnerOnboardingRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm">Loading SalonOS…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const loginPaths = { customer: '/login/customer', owner: '/login/owner', admin: '/login/admin' };
    return <Navigate to={loginPaths[requiredRole] || '/login/customer'} state={{ from: location }} replace />;
  }

  if (profile && requiredRole && profile.role !== requiredRole) {
    return <Navigate to={defaultPathForRole(profile.role)} replace />;
  }

  if (isCustomerOnboardingRequired && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (isOwnerOnboardingRequired && location.pathname !== '/onboarding/owner') {
    return <Navigate to="/onboarding/owner" replace />;
  }

  return children;
}

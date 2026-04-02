import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import CustomerApp from './pages/CustomerApp';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminPanel from './pages/AdminPanel';
import CustomerLogin from './pages/auth/CustomerLogin';
import OwnerLogin from './pages/auth/OwnerLogin';
import AdminLogin from './pages/auth/AdminLogin';
import NotFound from './pages/NotFound';
import SalonEntry from './pages/SalonEntry';
import SetupShop from './pages/SetupShop';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Public salon entry route — customers scan QR/link here */}
          <Route path="/salon/:slug" element={<SalonEntry />} />
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/login/owner" element={<OwnerLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login" element={<Navigate to="/login/customer" replace />} />
          {/* Owner setup flow */}
          <Route
            path="/setup"
            element={(
              <ProtectedRoute requiredRole="owner">
                <SetupShop />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/app/*"
            element={(
              <ProtectedRoute requiredRole="customer">
                <CustomerApp />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard/*"
            element={(
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/*"
            element={(
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import CustomerApp from './pages/CustomerApp';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminPanel from './pages/AdminPanel';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerEmailLogin from './pages/auth/CustomerEmailLogin';
import OwnerLogin from './pages/auth/OwnerLogin';
import AdminLogin from './pages/auth/AdminLogin';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/login/customer-email" element={<CustomerEmailLogin />} />
          <Route path="/login/owner" element={<OwnerLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login" element={<Navigate to="/login/customer" replace />} />
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

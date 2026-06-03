import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { RoleGuard } from '@/auth/RoleGuard';
import { Permission } from '@gupta/shared';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import LoginPage from '@/pages/auth/Login';
import DashboardPage from '@/pages/dashboard/Dashboard';
import PurchasesPage from '@/pages/purchases/Purchases';
import TendersPage from '@/pages/tenders/Tenders';
import InventoryPage from '@/pages/inventory/Inventory';
import SitesPage from '@/pages/masters/Sites';
import VendorsPage from '@/pages/masters/Vendors';
import ItemsPage from '@/pages/masters/Items';
import TeamPage from '@/pages/admin/Team';
import ActivityLogsPage from '@/pages/admin/ActivityLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/tenders" element={<TendersPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/masters/sites" element={<SitesPage />} />
              <Route path="/masters/vendors" element={<VendorsPage />} />
              <Route path="/masters/items" element={<ItemsPage />} />
              <Route
                path="/admin/team"
                element={
                  <RoleGuard permission={Permission.MANAGE_USERS}>
                    <TeamPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/activity"
                element={
                  <RoleGuard permission={Permission.VIEW_ACTIVITY_LOGS}>
                    <ActivityLogsPage />
                  </RoleGuard>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}

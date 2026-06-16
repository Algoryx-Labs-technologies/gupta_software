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
import LabourExpensesPage from '@/pages/labour-expenses/LabourExpenses';
import EmployeeSalaryPage from '@/pages/employee-salary/EmployeeSalary';
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
              <Route path="/labour-expenses" element={<LabourExpensesPage />} />
              <Route path="/employee-salary" element={<EmployeeSalaryPage />} />
              <Route path="/labour" element={<Navigate to="/labour-expenses" replace />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route
                path="/sites"
                element={
                  <RoleGuard permission={Permission.MANAGE_MASTERS}>
                    <SitesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendors"
                element={
                  <RoleGuard permission={Permission.MANAGE_MASTERS}>
                    <VendorsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/items"
                element={
                  <RoleGuard permission={Permission.MANAGE_MASTERS}>
                    <ItemsPage />
                  </RoleGuard>
                }
              />
              <Route path="/masters/sites" element={<Navigate to="/sites" replace />} />
              <Route path="/masters/vendors" element={<Navigate to="/vendors" replace />} />
              <Route path="/masters/items" element={<Navigate to="/items" replace />} />
              <Route path="/masters" element={<Navigate to="/sites" replace />} />
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

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { BootScreen, ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";

// Pages load on demand so the first screen stays small.
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const CustomersPage = lazy(() => import("./features/customers/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./features/customers/CustomerDetailPage"));
const LeadsPage = lazy(() => import("./features/leads/LeadsPage"));
const LeadDetailPage = lazy(() => import("./features/leads/LeadDetailPage"));
const FollowUpsPage = lazy(() => import("./features/followups/FollowUpsPage"));
const ProductsPage = lazy(() => import("./features/products/ProductsPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const NotFoundPage = lazy(() => import("./features/NotFoundPage"));

export const App = (): JSX.Element => (
  <Suspense fallback={<BootScreen />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  </Suspense>
);

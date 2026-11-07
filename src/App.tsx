import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import RequireRole, { HomeRedirect } from "./auth/RequireRole";
import { ALL_NAV_ITEMS } from "./config/navigation";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import StaffPage from "./pages/StaffPage";
import { StoreProvider } from "./stores/StoreContext";
import PosPage from "./pages/pos/PosPage";
import {
  AiInsightsPage,
  DashboardPage,
  InventoryPage,
  PaymentsPage,
  ProductsPage,
  SalesReportsPage,
} from "./pages/placeholders";


const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const PAGES: Record<string, ReactElement> = {
  "/dashboard": <DashboardPage />,
  "/products": <ProductsPage />,
  "/inventory": <InventoryPage />,
  "/pos": <PosPage />,
  "/sales": <SalesReportsPage />,
  "/ai-insights": <AiInsightsPage />,
  "/staff": <StaffPage />,
  "/payments": <PaymentsPage />,
};

export default function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<SetupPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<HomeRedirect />} />
                {ALL_NAV_ITEMS.map((item) => (
                  <Route
                    key={item.path}
                    path={item.path}
                    element={<RequireRole roles={item.roles}>{PAGES[item.path]}</RequireRole>}
                  />
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  return googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app;
}
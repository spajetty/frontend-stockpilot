import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import StaffPage from "./pages/StaffPage";
import WelcomePage from "./pages/WelcomePage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/setup" element={<SetupPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Owner"]} />}>
            <Route path="/staff" element={<StaffPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );

  // The Google button only exists when a client id is configured
  return googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app;
}
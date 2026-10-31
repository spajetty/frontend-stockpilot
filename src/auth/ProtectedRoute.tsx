import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

interface ProtectedRouteProps {
  roles?: Role[]; // when set, only these roles may open the nested routes
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
        <i className="ri-loader-4-line animate-spin text-3xl text-brand" aria-hidden="true" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // First login: nothing else is reachable until setup is finished
  if (user.isFirstLogin && location.pathname !== "/setup") return <Navigate to="/setup" replace />;
  if (!user.isFirstLogin && location.pathname === "/setup") return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
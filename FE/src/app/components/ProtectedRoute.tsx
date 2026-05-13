import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect admin/staff away from user store pages to their dashboards
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === "staff") {
    return <Navigate to="/staff" replace />;
  }

  return <Outlet />;
}

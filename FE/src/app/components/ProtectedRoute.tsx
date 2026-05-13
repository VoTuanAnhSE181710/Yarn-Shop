import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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

  return <>{children}</>;
}

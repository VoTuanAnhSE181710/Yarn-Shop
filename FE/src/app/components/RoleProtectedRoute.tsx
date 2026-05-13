import { Navigate } from "react-router";
import { useAuth, UserRole } from "../context/AuthContext";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard based on user's actual role
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "staff") return <Navigate to="/staff" replace />;
    return <Navigate to="/shop" replace />;
  }

  return <>{children}</>;
}

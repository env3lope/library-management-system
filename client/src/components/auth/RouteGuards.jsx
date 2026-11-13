import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

function AuthGate() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ui text-text-subtle">Завантажуємо бібліотеку…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function ManagerGate() {
  const { user } = useAuth();
  if (user.role === "reader") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export { AuthGate, ManagerGate };

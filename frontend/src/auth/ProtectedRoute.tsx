import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LogoMark } from "../components/brand/Logo";
import { Spinner } from "../components/ui/Spinner";

// Hosted APIs on free plans can take a while to wake up. Say so instead of showing a bare spinner.
export const BootScreen = (): JSX.Element => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <LogoMark size={44} />
      <Spinner className="muted h-5 w-5" />
      {slow && <p className="muted max-w-xs text-sm">Connecting to the server. The first visit after a quiet spell can take up to a minute.</p>}
    </div>
  );
};

export const ProtectedRoute = (): JSX.Element => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <BootScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
};

export const AdminRoute = ({ children }: { children: JSX.Element }): JSX.Element => {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? children : <Navigate to="/" replace />;
};

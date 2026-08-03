import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Spinner } from "../components/ui/Spinner";

export const ProtectedRoute = (): JSX.Element => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }: { children: JSX.Element }): JSX.Element => {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? children : <Navigate to="/" replace />;
};

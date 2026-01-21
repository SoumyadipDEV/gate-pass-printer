import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUser();

  // Show nothing while loading from localStorage
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

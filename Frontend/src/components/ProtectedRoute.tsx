import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { profile, loading } = useAuth();

  if (loading) {
    // Show a loading state while checking auth
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

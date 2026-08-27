import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';

// Saare Dashboards Import Karein
import OwnerDashboard from './features/dashboard/OwnerDashboard';
import ManagerDashboard from './features/dashboard/ManagerDashboard';
import FrontDeskDashboard from './features/dashboard/FrontDeskDashboard';
import TherapistDashboard from './features/dashboard/TherapistDashboard';
import InventoryDashboardPage from './features/inventory/pages/InventoryDashboardPage';

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Yeh Router ab har user ko uske specific role ke hisaab se page dikhayega
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
    return <OwnerDashboard />;
  }

  if (user?.role === 'MANAGER') {
    return <ManagerDashboard />;
  }

  if (user?.role === 'FRONT_DESK') {
    return <FrontDeskDashboard />;
  }

  if (user?.role === 'THERAPIST') {
    return <TherapistDashboard />;
  }

  // Fallback agar koi aur role hai ya role undefined hai
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allow={['OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST', 'ADMIN']}>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/*"
              element={
                <ProtectedRoute allow={['OWNER', 'MANAGER']}>
                  <InventoryDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
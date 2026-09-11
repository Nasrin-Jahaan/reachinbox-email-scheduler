import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AuthCallback } from './pages/AuthCallback';
import { SlackCallback } from './pages/SlackCallback';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SenderModal } from './components/SenderModal';
import { useSenders } from './hooks/useSenders';
import { Loading } from './components/ui/Loading';

export function App() {
  const { user, loading, refetchUser, devLogin, logout } = useAuth();
  const { senders, createSender } = useSenders();
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loading message="Initializing ReachInbox Email Scheduler..." size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />

      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onDevLogin={devLogin} /> : <Navigate to="/" replace />}
        />

        <Route
          path="/auth/callback"
          element={<AuthCallback onSuccess={refetchUser} />}
        />

        <Route
          path="/slack/callback"
          element={<SlackCallback onSuccess={refetchUser} />}
        />

        <Route
          path="/"
          element={
            user ? (
              <DashboardLayout
                user={user}
                onLogout={logout}
                onOpenSenderModal={() => setIsSenderModalOpen(true)}
              >
                <Dashboard user={user} />
                <SenderModal
                  isOpen={isSenderModalOpen}
                  onClose={() => setIsSenderModalOpen(false)}
                  senders={senders}
                  onCreateSender={async (name, email) => {
                    await createSender(name, email);
                    await refetchUser();
                  }}
                />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

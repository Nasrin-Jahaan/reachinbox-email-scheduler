import React from 'react';
import { Header } from './Header';
import { UserProfile } from '../../types/auth';

interface DashboardLayoutProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenSenderModal: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onLogout,
  onOpenSenderModal,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Header
        user={user}
        onLogout={onLogout}
        onOpenSenderModal={onOpenSenderModal}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

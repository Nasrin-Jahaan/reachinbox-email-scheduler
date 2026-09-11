import React from 'react';
import { UserProfile } from '../../types/auth';
import { Button } from '../ui/Button';
import { Mail, LogOut, Slack, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenSenderModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenSenderModal,
}) => {
  const handleConnectSlack = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${API_BASE}/api/slack/connect`;
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-100 text-base tracking-tight">ReachInbox</span>
              <span className="text-[10px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                Scheduler
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">Outbox Labs Technical Assignment</p>
          </div>
        </div>

        {/* Right side controls */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Bull Board Queue link */}
            <a
              href="http://localhost:5000/admin/queues"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Queue Dashboard
            </a>

            {/* Manage Senders Button */}
            <Button
              onClick={onOpenSenderModal}
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Senders ({user.senders?.length || 0})
            </Button>

            {/* Slack Connection Button/Status */}
            {user.slackConnected ? (
              <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">
                <Slack className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Connected to</span> {user.slackWorkspace || 'Slack'}
              </div>
            ) : (
              <Button
                onClick={handleConnectSlack}
                variant="secondary"
                size="sm"
                icon={<Slack className="w-4 h-4 text-emerald-400" />}
              >
                Connect Slack
              </Button>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-200 leading-none">{user.name}</p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  toast.success('Logged out');
                }}
                className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

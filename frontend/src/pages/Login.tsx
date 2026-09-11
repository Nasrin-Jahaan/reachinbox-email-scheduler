import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, ShieldCheck, Zap, Slack, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginProps {
  onDevLogin: (email?: string, name?: string) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ onDevLogin }) => {
  const [devEmail, setDevEmail] = useState('demo.engineer@reachinbox.ai');
  const [devName, setDevName] = useState('Demo Software Engineer');
  const [showDevModal, setShowDevModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onDevLogin(devEmail, devName);
      toast.success(`Logged in as ${devName}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-6">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-100 tracking-tight">ReachInbox</h2>
        <p className="mt-2 text-sm text-gray-400">
          Production-grade Full-Stack Email Scheduler & Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {/* Primary Google OAuth Button */}
          <Button
            onClick={handleGoogleLogin}
            variant="secondary"
            size="lg"
            className="w-full justify-center bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 shadow-md py-3"
            icon={
              <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Or Quick Demo Mode
            </span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          {/* Quick Dev Login */}
          {!showDevModal ? (
            <Button
              onClick={() => setShowDevModal(true)}
              variant="outline"
              size="md"
              className="w-full justify-center text-xs"
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            >
              Instant Dev Demo Login
            </Button>
          ) : (
            <form onSubmit={handleDevSubmit} className="space-y-3 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
              <Input
                label="Demo Email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <Input
                label="Demo Name"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                placeholder="Full Name"
              />
              <Button type="submit" loading={loading} className="w-full">
                Sign In to Dashboard
              </Button>
            </form>
          )}

          {/* Key Features List */}
          <div className="pt-4 border-t border-gray-800/80 space-y-2.5 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>BullMQ + Redis Persistent Delayed Jobs</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Distributed Hourly Rate Limits & Provider Throttling</span>
            </div>
            <div className="flex items-center gap-2">
              <Slack className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Real Slack OAuth & Hourly Limit Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Elasticsearch Powered Full-Text Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

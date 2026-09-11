import React, { useState } from 'react';
import { UserProfile } from '../types/auth';
import { ScheduledEmails } from '../components/ScheduledEmails';
import { SentEmails } from '../components/SentEmails';
import { ComposeEmailModal } from '../components/ComposeEmailModal';
import { SenderModal } from '../components/SenderModal';
import { Button } from '../components/ui/Button';
import { useSenders } from '../hooks/useSenders';
import { useEmails } from '../hooks/useEmails';
import { Plus, Search, Mail, Send, Clock, Slack, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { senders, createSender } = useSenders();
  const { scheduleEmails, refetchEmails } = useEmails(activeTab === 'scheduled' ? 'SCHEDULED' : 'SENT');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-gray-900 to-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Schedule bulk campaigns, manage sender rate limits, and monitor live BullMQ delivery queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetchEmails()}
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-4 h-4 text-gray-400" />}
          >
            Refresh
          </Button>

          <Button
            onClick={() => setIsComposeOpen(true)}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Compose New Email
          </Button>
        </div>
      </div>

      {/* Control Bar: Tabs + Elasticsearch Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-gray-900 border border-gray-800 rounded-xl max-w-xs">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scheduled'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Scheduled
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Sent
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipient, subject, or content (Elasticsearch)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'scheduled' ? (
        <ScheduledEmails
          onComposeClick={() => setIsComposeOpen(true)}
          searchQuery={searchQuery}
        />
      ) : (
        <SentEmails
          onComposeClick={() => setIsComposeOpen(true)}
          searchQuery={searchQuery}
        />
      )}

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        senders={senders}
        onSchedule={async (payload) => {
          await scheduleEmails(payload);
          refetchEmails();
        }}
      />

      {/* Sender Manager Modal */}
      <SenderModal
        isOpen={isSenderModalOpen}
        onClose={() => setIsSenderModalOpen(false)}
        senders={senders}
        onCreateSender={async (name, email) => {
          await createSender(name, email);
        }}
      />
    </div>
  );
};

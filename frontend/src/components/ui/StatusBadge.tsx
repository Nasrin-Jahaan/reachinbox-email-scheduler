import React from 'react';
import { EmailStatus } from '../../types/email';
import { Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: EmailStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs = {
    SCHEDULED: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Clock,
      label: 'Scheduled',
    },
    PROCESSING: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
      icon: RefreshCw,
      label: 'Processing',
    },
    SENT: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Sent',
    },
    FAILED: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: XCircle,
      label: 'Failed',
    },
    RATE_LIMITED: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: AlertTriangle,
      label: 'Rate Limited',
    },
  };

  const config = configs[status] || configs.SCHEDULED;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

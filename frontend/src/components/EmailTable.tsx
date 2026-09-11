import React from 'react';
import { Email, Pagination } from '../types/email';
import { StatusBadge } from './ui/StatusBadge';
import { Loading } from './ui/Loading';
import { EmptyState } from './ui/EmptyState';
import { ChevronLeft, ChevronRight, Mail, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface EmailTableProps {
  emails: Email[];
  pagination: Pagination;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onComposeClick?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showSentTime?: boolean;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  pagination,
  loading,
  onPageChange,
  onComposeClick,
  emptyTitle = 'No emails found',
  emptyDescription = 'You have not scheduled any emails matching this view yet.',
  showSentTime = false,
}) => {
  if (loading && emails.length === 0) {
    return <Loading message="Loading email queue..." />;
  }

  if (!loading && emails.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={Mail}
        actionLabel={onComposeClick ? 'Compose New Email' : undefined}
        onAction={onComposeClick}
      />
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-950/60 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">{showSentTime ? 'Sent Time' : 'Scheduled Time'}</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {emails.map((email) => {
              const displayDate = showSentTime && email.sentAt ? email.sentAt : email.scheduledAt;
              const formattedDate = new Date(displayDate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={email.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {email.recipient.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[200px]">{email.recipient}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">
                    <div>
                      <p className="font-semibold text-gray-100 truncate max-w-[240px]">{email.subject}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[240px]">{email.body}</p>
                      {email.errorMessage && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {email.errorMessage}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-400">
                    {email.sender?.name ? `${email.sender.name}` : email.senderId}
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {formattedDate}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={email.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-950/40 border-t border-gray-800 text-xs text-gray-400">
          <div>
            Showing <span className="font-medium text-gray-200">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium text-gray-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium text-gray-200">{pagination.total}</span> emails
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useEmails } from '../hooks/useEmails';
import { EmailTable } from './EmailTable';

interface ScheduledEmailsProps {
  onComposeClick: () => void;
  searchQuery: string;
}

export const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({
  onComposeClick,
  searchQuery,
}) => {
  const { emails, pagination, loading, refetchEmails } = useEmails('SCHEDULED');

  return (
    <div>
      <EmailTable
        emails={emails}
        pagination={pagination}
        loading={loading}
        onPageChange={(page) => refetchEmails(page, searchQuery)}
        onComposeClick={onComposeClick}
        emptyTitle="No Scheduled Emails"
        emptyDescription="You have no emails currently scheduled or queueing for dispatch."
        showSentTime={false}
      />
    </div>
  );
};

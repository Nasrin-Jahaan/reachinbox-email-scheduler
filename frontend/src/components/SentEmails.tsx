import React from 'react';
import { useEmails } from '../hooks/useEmails';
import { EmailTable } from './EmailTable';

interface SentEmailsProps {
  onComposeClick: () => void;
  searchQuery: string;
}

export const SentEmails: React.FC<SentEmailsProps> = ({
  onComposeClick,
  searchQuery,
}) => {
  const { emails, pagination, loading, refetchEmails } = useEmails('SENT');

  return (
    <div>
      <EmailTable
        emails={emails}
        pagination={pagination}
        loading={loading}
        onPageChange={(page) => refetchEmails(page, searchQuery)}
        onComposeClick={onComposeClick}
        emptyTitle="No Sent Emails Yet"
        emptyDescription="Emails that have been successfully dispatched will appear here."
        showSentTime={true}
      />
    </div>
  );
};

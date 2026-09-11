import { useState, useEffect, useCallback } from 'react';
import { emailApi } from '../services/api';
import { Email, Pagination, ScheduleEmailPayload } from '../types/email';

export function useEmails(statusFilter?: string) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchEmails = useCallback(
    async (page = 1, query = searchQuery) => {
      try {
        setLoading(true);
        setError(null);

        if (query.trim()) {
          const res = await emailApi.searchEmails(query, page, 10);
          setEmails(res.data.data || []);
          if (res.data.pagination) setPagination(res.data.pagination);
        } else {
          const res = await emailApi.getEmails(statusFilter, page, 10);
          setEmails(res.data.emails || []);
          if (res.data.pagination) setPagination(res.data.pagination);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchQuery]
  );

  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  const scheduleEmails = async (payload: ScheduleEmailPayload) => {
    const res = await emailApi.scheduleEmails(payload);
    await fetchEmails(1);
    return res.data;
  };

  return {
    emails,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetchEmails: fetchEmails,
    scheduleEmails,
  };
}

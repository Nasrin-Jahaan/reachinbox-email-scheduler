import { useState, useEffect, useCallback } from 'react';
import { senderApi } from '../services/api';
import { Sender } from '../types/sender';

export function useSenders() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSenders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await senderApi.getSenders();
      setSenders(res.data.senders || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load senders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  const createSender = async (name: string, email: string) => {
    const res = await senderApi.createSender(name, email);
    await fetchSenders();
    return res.data.sender;
  };

  return {
    senders,
    loading,
    error,
    refetchSenders: fetchSenders,
    createSender,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { UserProfile } from '../types/auth';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.getMe();
      setUser(res.data);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setError(err.response?.data?.error || 'Not authenticated');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const devLogin = async (email?: string, name?: string) => {
    setLoading(true);
    try {
      await authApi.devLogin(email, name);
      await fetchUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Dev login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  return {
    user,
    loading,
    error,
    refetchUser: fetchUser,
    devLogin,
    logout,
  };
}

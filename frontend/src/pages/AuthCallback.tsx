import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../components/ui/Loading';
import toast from 'react-hot-toast';

interface AuthCallbackProps {
  onSuccess: () => Promise<void>;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      try {
        await onSuccess();
        toast.success('Successfully logged in with Google');
        navigate('/');
      } catch (err) {
        toast.error('Authentication failed');
        navigate('/login');
      }
    };
    processAuth();
  }, [onSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loading message="Completing Google OAuth sign in..." size="lg" />
    </div>
  );
};

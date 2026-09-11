import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../components/ui/Loading';
import toast from 'react-hot-toast';

interface SlackCallbackProps {
  onSuccess: () => Promise<void>;
}

export const SlackCallback: React.FC<SlackCallbackProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const processSlack = async () => {
      try {
        await onSuccess();
        toast.success('Slack workspace connected successfully! Hourly rate-limit alerts enabled.');
        navigate('/');
      } catch (err) {
        toast.error('Slack connection failed');
        navigate('/');
      }
    };
    processSlack();
  }, [onSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loading message="Connecting Slack Workspace..." size="lg" />
    </div>
  );
};

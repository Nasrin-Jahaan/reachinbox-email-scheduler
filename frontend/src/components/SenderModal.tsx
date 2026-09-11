import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sender } from '../types/sender';
import { Plus, User, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  senders: Sender[];
  onCreateSender: (name: string, email: string) => Promise<void>;
}

export const SenderModal: React.FC<SenderModalProps> = ({
  isOpen,
  onClose,
  senders,
  onCreateSender,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter name and email');
      return;
    }
    setLoading(true);
    try {
      await onCreateSender(name.trim(), email.trim());
      toast.success('Sender created successfully');
      setName('');
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create sender');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sender Identities" maxWidth="md">
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Active Senders ({senders.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-200">{sender.name}</p>
                  <p className="text-xs text-gray-400">{sender.email}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-800 space-y-4">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Add New Sender</h4>
          <Input
            label="Sender Name"
            placeholder="e.g. Sales Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-4 h-4" />}
          />
          <Input
            label="Sender Email"
            type="email"
            placeholder="sales@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={<Plus className="w-4 h-4" />}>
              Add Sender
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

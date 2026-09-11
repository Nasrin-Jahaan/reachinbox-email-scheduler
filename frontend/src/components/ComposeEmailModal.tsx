import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sender } from '../types/sender';
import { ScheduleEmailPayload } from '../types/email';
import { parseFileContent, parseEmailsFromText } from '../utils/csvParser';
import { Upload, Calendar, Clock, AlertCircle, FileText, CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  senders: Sender[];
  onSchedule: (payload: ScheduleEmailPayload) => Promise<void>;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  senders,
  onSchedule,
}) => {
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [recipientsInput, setRecipientsInput] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);

  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (senders.length > 0 && !selectedSenderId) {
      setSelectedSenderId(senders[0].id);
    }
  }, [senders, selectedSenderId]);

  useEffect(() => {
    // Default to current date/time + 2 minutes
    const now = new Date(Date.now() + 2 * 60 * 1000);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
  }, [isOpen]);

  useEffect(() => {
    const { validEmails, invalidEmails } = parseEmailsFromText(recipientsInput);
    setParsedEmails(validEmails);
    setInvalidEmails(invalidEmails);
  }, [recipientsInput]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseFileContent(file);
      if (result.validEmails.length > 0) {
        setRecipientsInput((prev) => {
          const combined = prev ? `${prev}\n${result.validEmails.join('\n')}` : result.validEmails.join('\n');
          return combined;
        });
        toast.success(`Imported ${result.validEmails.length} emails from ${file.name}`);
      } else {
        toast.error('No valid emails found in file');
      }
    } catch (err) {
      toast.error('Failed to parse file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSenderId) {
      toast.error('Please select a sender');
      return;
    }
    if (parsedEmails.length === 0) {
      toast.error('Please enter at least one valid recipient email address');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setLoading(true);
    try {
      const isoStartTime = new Date(startTime).toISOString();
      await onSchedule({
        senderId: selectedSenderId,
        recipients: parsedEmails,
        subject: subject.trim(),
        body: body.trim(),
        startTime: isoStartTime,
        delayBetweenEmailsSeconds: delaySeconds,
        hourlyLimit,
      });

      toast.success(`Successfully scheduled ${parsedEmails.length} emails!`);
      onClose();
      // Reset form
      setRecipientsInput('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose & Schedule Emails" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sender Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
            From Sender
          </label>
          <select
            value={selectedSenderId}
            onChange={(e) => setSelectedSenderId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 px-3.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {senders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
        </div>

        {/* Recipients input & File upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Recipients
            </label>

            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload CSV / TXT
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={3}
            placeholder="Enter recipient email addresses (comma separated, new line, or space)..."
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Email Detection Pill Counter */}
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {parsedEmails.length} email addresses detected
              </span>

              {invalidEmails.length > 0 && (
                <span className="flex items-center gap-1 font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {invalidEmails.length} invalid
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subject */}
        <Input
          label="Subject"
          placeholder="e.g. Special Product Update"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          icon={<FileText className="w-4 h-4" />}
        />

        {/* Email Body */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
            Email Content
          </label>
          <textarea
            rows={4}
            placeholder="Type your message body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Schedule & Throttling Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-800">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Delay / Email (sec)
            </label>
            <input
              type="number"
              min="0"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Hourly Limit
            </label>
            <input
              type="number"
              min="1"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 200)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={<Send className="w-4 h-4" />}>
            Schedule {parsedEmails.length} Email{parsedEmails.length === 1 ? '' : 's'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

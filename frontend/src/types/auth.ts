import { Sender } from './sender';

export interface UserProfile {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  senders: Sender[];
  slackConnected: boolean;
  slackWorkspace: string | null;
  createdAt: string;
}

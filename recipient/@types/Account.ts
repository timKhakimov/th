export interface Account {
  _id?: string;
  username: string;
  cookies: Array<string> | null;
  userAgent: string;
  localStorage: Record<string, string>;
  lastProcessedBy: Date;
  banned: boolean;
  aiUsername: string;
  name: string;
  setup: boolean;
  messageCount: number;
  remainingTime: Date;
  server: string;
}

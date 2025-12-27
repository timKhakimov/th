type BaseGroupIdUsers = {
  _id?: string;
  groupId: string;
  contact: string;
  source: string;
  processedAt?: Date;
  attemptCount?: number;
};

type SentGroupIdUsers = BaseGroupIdUsers & {
  sent: true;
  recipientId: string;
};

type FailedGroupIdUsers = BaseGroupIdUsers & {
  failed: true;
  reason: string;
};

export type GroupIdUsers =
  | BaseGroupIdUsers
  | SentGroupIdUsers
  | FailedGroupIdUsers;

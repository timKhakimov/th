type BaseGroupIdUsers = {
  _id?: string;
  source: string;
  contact: string;
  groupObjectId: string;
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

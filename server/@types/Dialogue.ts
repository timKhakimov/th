export interface Dialogue {
  _id?: string;

  group_id: number;
  account_id: string;
  recipient_id: string;
  recipient_username: string;
  recipient_title: string;
  recipient_bio: string | null;
  recipient_phone: string | null;
  messages: Array<string>;
  viewed: boolean;

  blocked?: boolean;

  dateCreated: string;
}

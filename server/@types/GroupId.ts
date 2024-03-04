export interface GroupId {
  _id?: string;
  groupId: number;
  target: number;
  currentCount: number;
  database: Array<string>;
  prompts: { first?: string; continuing?: string; offerDescription?: string };
  dateCreated?: Date;
  dateUpdated?: Date;
  current?: boolean;
  language?: string;
}

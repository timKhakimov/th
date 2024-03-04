import { MongoClient, Db, Collection } from "mongodb";

import { Dialogue } from "../@types/Dialogue";

const dbName = "telethon";
const collectionName = "dialogues";
const uri = process.env.DATABASE_URI || "";

class DialogueService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Dialogue> | null = null;

  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;

    this.connect = this.connect.bind(this);
    this.postDialogue = this.postDialogue.bind(this);
    this.getUsernamesByGroupId = this.getUsernamesByGroupId.bind(this);
  }

  async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  async postDialogue(dialogue: Record<string, string>) {
    await this.connect();
    if (!this.collection) {
      return;
    }

    await this.collection.updateOne(
      {
        account_id: dialogue.account_id,
        recipient_id: dialogue.recipient_id,
      },
      { $set: dialogue },
      { upsert: true }
    );
  }

  async getUsernamesByGroupId(groupId: Dialogue["group_id"]) {
    await this.connect();
    if (!this.collection) {
      return [];
    }

    const usernames = await this.collection.distinct("recipient_username", {
      group_id: groupId,
    });
    return usernames.map((usernames) => usernames.toLowerCase());
  }
}

export default new DialogueService();

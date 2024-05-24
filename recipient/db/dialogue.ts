import { MongoClient, Db, Collection } from "mongodb";

import { Dialogue } from "../@types/Dialogue";

const dbName = "core";
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

    const existingDialogue = await this.collection.findOne({
      accountId: dialogue.accountId,
      recipientId: dialogue.recipientId,
    });

    if (existingDialogue) {
      await this.collection.updateOne(
        {
          accountId: dialogue.accountId,
          recipientId: dialogue.recipientId,
        },
        {
          $set: {
            ...dialogue,
            dateUpdated: String(new Date()),
          },
        }
      );
    } else {
      await this.collection.insertOne({
        ...dialogue,
        dateCreated: String(new Date()),
        dateUpdated: String(new Date()),
      } as Dialogue);
    }
  }

  async getUsernamesByGroupId(groupId: Dialogue["group_id"]) {
    await this.connect();
    if (!this.collection) {
      return [];
    }

    const usernames = await this.collection.distinct("recipientUsername", {
      groupId,
    });
    return usernames.map((usernames) => usernames.toLowerCase());
  }
}

export default new DialogueService();

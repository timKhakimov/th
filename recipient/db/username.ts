import { MongoClient, Db, Collection } from "mongodb";

import { Message } from "../@types/Username";

const dbName = "core";
const collectionName = "messages";
const uri = process.env.DATABASE_URI || "";

class UsernameService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Message> | null = null;

  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;

    this.connect = this.connect.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.getFailedUsernames = this.getFailedUsernames.bind(this);
  }

  async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  async updateUsername(username: string, set = {}) {
    await this.connect();
    if (!this.collection) {
      return;
    }

    await this.collection.updateOne(
      { username: username.toLowerCase() },
      { $set: set },
      { upsert: true }
    );
  }

  async getFailedUsernames() {
    await this.connect();
    if (!this.collection) {
      return [];
    }

    const usernames = await this.collection.distinct("username", {
      failed: true,
    });
    return usernames.map((username) => username.toLowerCase());
  }
}

export default new UsernameService();

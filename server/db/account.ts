import { MongoClient, Db, Collection } from "mongodb";

import { Account } from "../@types/Account";

const dbName = "telethon";
const collectionName = "accounts";
const uri = process.env.DATABASE_URI || "";

class AccountService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Account> | null = null;

  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;

    this.connect = this.connect.bind(this);

    this.updateAccountRemainingTime =
      this.updateAccountRemainingTime.bind(this);
    this.incrementMessageCount = this.incrementMessageCount.bind(this);
  }

  async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  async incrementMessageCount(id: string) {
    await this.connect();
    if (!this.collection) {
      return;
    }

    const account = await this.collection.findOne({ id });

    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updatedData = {
      messageCount: (account.messageCount || 0) + 1,
    };

    await this.collection.updateOne({ id }, { $set: updatedData });
  }

  async updateAccountRemainingTime(id: string, remainingTime: number) {
    await this.connect();
    if (!this.collection) {
      return;
    }

    const currentTime = new Date();
    const futureTime = new Date(currentTime.getTime() + remainingTime);

    const updatedData = {
      remainingTime: futureTime,
    };

    await this.collection.updateOne({ id }, { $set: updatedData });
  }
}

export default new AccountService();

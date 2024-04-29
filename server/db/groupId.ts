import { MongoClient, Db, Collection } from "mongodb";

import { GroupId } from "../@types/GroupId";

const dbName = "core";
const collectionName = "groupId";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private fullDocs: Array<GroupId> | null = null;
  private fullDocsEnglish: Array<GroupId> | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GroupId> | null = null;
  private fullDocsFetchTime: number = Date.now();
  private fullDocsEnglishFetchTime: number = Date.now();

  constructor() {
    this.connect = this.connect.bind(this);
    this.createOrUpdateCurrentCount =
      this.createOrUpdateCurrentCount.bind(this);
    this.getGroupId = this.getGroupId.bind(this);
  }

  private async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  public async createOrUpdateCurrentCount(groupId: GroupId["groupId"]) {
    await this.connect();
    if (!this.collection) {
      return;
    }

    const filter = { groupId };
    const update = {
      $inc: { currentCount: 1 },
      $set: { dateUpdated: new Date() },
    };
    const options = { upsert: true };

    await this.collection.updateOne(filter, update, options);
  }

  public async getGroupId() {
    await this.connect();
    if (!this.collection) {
      return;
    }

    const cacheTimeout = 60 * 60 * 1000;

    if (
      !this.fullDocs ||
      Date.now() - (this.fullDocsFetchTime || 0) > cacheTimeout
    ) {
      this.fullDocs = await this.collection.find().toArray();
      this.fullDocsFetchTime = Date.now();
    }

    this.fullDocs = this.fullDocs.filter(
      (doc) =>
        doc.currentCount < doc.target &&
        (doc?.language ? doc.language : "РУССКИЙ") === "РУССКИЙ"
    );
    console.log(
      `Текущие активные groupId: ${JSON.stringify(
        this.fullDocs.map((docs) => ({
          groupId: docs.groupId,
          currentCount: docs.currentCount,
          target: docs.target,
        }))
      )}`
    );

    let currentIndex = this.fullDocs.findIndex((doc) => doc.current === true);

    if (currentIndex === -1) {
      currentIndex = this.fullDocs.findIndex((e) => e.groupId === 12343207729);
    }

    this.fullDocs[currentIndex].current = false;
    const nextIndex = (currentIndex + 1) % this.fullDocs.length;
    this.fullDocs[nextIndex].current = true;

    return this.fullDocs[nextIndex];
  }
  public async getGroupIdEnglish() {
    await this.connect();
    if (!this.collection) {
      return;
    }

    const cacheTimeout = 60 * 60 * 1000;

    if (
      !this.fullDocsEnglish ||
      Date.now() - (this.fullDocsEnglishFetchTime || 0) > cacheTimeout
    ) {
      this.fullDocsEnglish = await this.collection.find().toArray();
      this.fullDocsEnglishFetchTime = Date.now();
    }

    this.fullDocsEnglish = this.fullDocsEnglish.filter(
      (doc) =>
        doc.currentCount < doc.target &&
        (doc?.language ? doc.language : "РУССКИЙ") === "АНГЛИЙСКИЙ"
    );
    console.log(
      `Текущие активные groupId: ${JSON.stringify(
        this.fullDocsEnglish.map((docs) => ({
          groupId: docs.groupId,
          currentCount: docs.currentCount,
          target: docs.target,
        }))
      )}`
    );

    if (this.fullDocsEnglish.length === 0) {
      return null;
    }

    let currentIndex = this.fullDocsEnglish.findIndex(
      (doc) => doc.current === true
    );

    if (currentIndex === -1) {
      currentIndex = 0;
    }

    this.fullDocsEnglish[currentIndex].current = false;
    const nextIndex = (currentIndex + 1) % this.fullDocsEnglish.length;
    this.fullDocsEnglish[nextIndex].current = true;

    return this.fullDocsEnglish[nextIndex];
  }
}
export default new GroupIdService();

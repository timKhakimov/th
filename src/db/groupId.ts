import { MongoClient, Db, Collection } from "mongodb";

import { GroupId } from "../@types/GroupId";

const dbName = "core";
const collectionName = "groupId";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private fullDocs: Array<GroupId> | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GroupId> | null = null;
  private fullDocsFetchTime: number = Date.now();

  constructor() {
    this.connect = this.connect.bind(this);
    this.getGroupId = this.getGroupId.bind(this);
    this.incrementCurrentTargetByGroupId =
      this.incrementCurrentTargetByGroupId.bind(this);
  }

  private async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri);
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
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
      this.fullDocs = await this.collection
        .find(
          {},
          {
            projection: {
              history: 0,
              dateUpdated: 0,
              _id: 0,
            },
          }
        )
        .toArray();
      this.fullDocsFetchTime = Date.now();
    }

    this.fullDocs = this.fullDocs.filter(
      (doc) => doc.currentCount < doc.target
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
      currentIndex = this.fullDocs.findIndex((e) => e.groupId === 13228671259);
    }

    this.fullDocs[currentIndex].current = false;
    const nextIndex = (currentIndex + 1) % this.fullDocs.length;
    this.fullDocs[nextIndex].current = true;

    return this.fullDocs[nextIndex];
  }

  public incrementCurrentTargetByGroupId(groupId: GroupId["groupId"]) {
    if (!this.fullDocs) {
      return;
    }

    const docIndex = this.fullDocs.findIndex((doc) => doc.groupId === groupId);

    if (docIndex !== -1) {
      this.fullDocs[docIndex].currentCount += 1;
    }
  }
}
export default new GroupIdService();

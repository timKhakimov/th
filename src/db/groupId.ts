import { MongoClient, Db, Collection } from "mongodb";

import { GroupId } from "../@types/GroupId";

const dbName = "core";
const collectionName = "groupId";
const collectionNameUsers = "groupIdUsers";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private fullDocs: Array<GroupId> | null = null;
  private fullDocsWithPrefix: Array<GroupId> | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GroupId> | null = null;
  private collectionUsers: Collection<GroupId> | null = null;
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
    this.collectionUsers = this.db.collection(collectionNameUsers);
  }

  public async generateNPC(groupId: string) {
    await this.connect();
    if (!this.collectionUsers) {
      return null;
    }

    const currentTime = new Date(new Date().toISOString());
    const pastTime = new Date(currentTime.getTime() - 15 * 60000);

    const NPC = await this.collectionUsers.findOne<any>(
      {
        g: String(groupId),
        s: { $ne: true },
        f: { $ne: true },
        $or: [{ p: { $exists: false } }, { p: { $lt: pastTime } }],
      },
      {
        projection: {
          u: 1,
          g: 1,
          _id: 0,
        },
      }
    );

    if (NPC && NPC.u && NPC.g) {
      await this.collectionUsers.updateOne(
        { g: NPC.g, u: NPC.u },
        {
          $set: { p: currentTime },
          $inc: { c: 1 },
        }
      );
    }

    return NPC;
  }

  public async getGroupId(prefix: string | null) {
    await this.connect();
    if (!this.collection) {
      return null;
    }

    if (
      !this.fullDocs ||
      !this.fullDocsWithPrefix ||
      Date.now() - (this.fullDocsFetchTime || 0) > 3600000
    ) {
      const allDocs = await this.collection
        .find(
          {},
          {
            projection: {
              history: 0,
              dateUpdated: 0,
              database: 0,
              offer: 0,
              _id: 0,
            },
          }
        )
        .toArray();

      this.fullDocsWithPrefix = allDocs.filter((doc) =>
        String(doc.groupId).includes("-prefix-")
      );
      this.fullDocs = allDocs.filter(
        (doc) => !String(doc.groupId).includes("-prefix-")
      );

      this.fullDocsFetchTime = Date.now();
    }

    this.fullDocs = this.fullDocs
      .filter((doc) => doc.currentCount < doc.target)
      .filter((e) => e.groupId === "14523585683");
    this.fullDocsWithPrefix = this.fullDocsWithPrefix.filter(
      (doc) => doc.currentCount < doc.target
    );

    if (prefix) {
      console.log(
        "Current active groupId(s) (with -prefix-):",
        this.fullDocsWithPrefix.map((docs) => ({
          groupId: docs.groupId,
          currentCount: docs.currentCount,
          target: docs.target,
        }))
      );

      const groupIdByPrefix = this.fullDocsWithPrefix.find((doc) =>
        String(doc.groupId).includes(prefix)
      );

      return groupIdByPrefix;
    }

    console.log(
      "Current active groupId(s):",
      this.fullDocs.map((docs) => ({
        groupId: docs.groupId,
        currentCount: docs.currentCount,
        target: docs.target,
      }))
    );

    let currentIndex = this.fullDocs.findIndex((doc) => doc.current === true);
    if (currentIndex !== -1) {
      this.fullDocs[currentIndex].current = false;
    }

    const nextIndex = (currentIndex + 1) % this.fullDocs.length;
    if (Number.isNaN(nextIndex) || !this.fullDocs[nextIndex]) {
      return null;
    }

    this.fullDocs[nextIndex].current = true;
    return this.fullDocs[nextIndex] as GroupId;
  }

  public async updateProcessFalse() {
    await this.connect();
    if (!this.collectionUsers) {
      return null;
    }

    await this.collectionUsers.updateMany({ p: true }, { $set: { p: false } });
  }

  public incrementCurrentTargetByGroupId(groupId: GroupId["groupId"]) {
    const docIndex = this.fullDocs?.findIndex(
      (doc) => String(doc.groupId) === groupId
    );
    const docIndex2 = this.fullDocsWithPrefix?.findIndex(
      (doc) => String(doc.groupId) === groupId
    );

    if (this.fullDocs && typeof docIndex === "number" && docIndex !== -1) {
      this.fullDocs[docIndex].currentCount += 1;
    }

    if (
      this.fullDocsWithPrefix &&
      typeof docIndex2 === "number" &&
      docIndex2 !== -1
    ) {
      this.fullDocsWithPrefix[docIndex2].currentCount += 1;
    }
  }
}
export default new GroupIdService();

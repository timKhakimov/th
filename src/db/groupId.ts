import { MongoClient, Db, Collection, ObjectId } from "mongodb";

import { GroupIdUsers } from "../@types/GroupIdUsers";

const dbName = "core";
const collectionName = "groupId";
const collectionNameUsers = "groupIdUsers";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<{ groupId: string; _id: ObjectId }> | null =
    null;
  private collectionUsers: Collection<GroupIdUsers> | null = null;

  constructor() {
    this.connect = this.connect.bind(this);
    this.getGroupObjectId = this.getGroupObjectId.bind(this);
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

  public async generateNPC(groupObjectId: string) {
    await this.connect();
    if (!this.collectionUsers) {
      return null;
    }

    const NPC = await this.collectionUsers.findOne<GroupIdUsers>(
      {
        groupObjectId,
        sent: { $ne: true },
        failed: { $ne: true },
        processedAt: { $exists: false },
      },
      {
        projection: {
          _id: 0,
          source: 1,
          contact: 1,
        },
      }
    );

    if (NPC && NPC.contact) {
      await this.collectionUsers.updateOne(
        { groupObjectId, contact: NPC.contact },
        {
          $set: { processedAt: new Date() },
          $inc: { attemptCount: 1 },
        }
      );
    }

    return NPC;
  }

  public async getGroupObjectId(prefix: string | null) {
    await this.connect();
    if (!this.collection) {
      return null;
    }

    const trimmedPrefix = prefix?.trim()?.toLowerCase();
    const pipeline = [
      {
        $match: {
          target: { $ne: 0 },
          $expr: { $lt: ["$currentCount", "$target"] },
          ...(trimmedPrefix
            ? {
                groupId: {
                  $regex: `-prefix-${trimmedPrefix}` + "$",
                  $options: "i",
                },
              }
            : {
                groupId: {
                  $not: /-prefix-/i,
                },
              }),
        },
      },
      { $sample: { size: 1 } },
      {
        $project: {
          _id: 1,
        },
      },
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    const doc = result?.[0];
    if (!doc || !doc._id) {
      return null;
    }

    return String(doc._id);
  }

  public async updateGroupId(groupObjectId: string) {
    await this.connect();
    if (!this.collection) {
      return null;
    }

    await this.collection.updateOne(
      { _id: new ObjectId(groupObjectId) },
      {
        $set: { target: 0 },
      }
    );
  }
}
export default new GroupIdService();

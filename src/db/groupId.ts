import { MongoClient, Db, Collection } from "mongodb";

import { GroupId } from "../@types/GroupId";
import { GroupIdUsers } from "../@types/GroupIdUsers";

const dbName = "core";
const collectionName = "groupId";
const collectionNameUsers = "groupIdUsers";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GroupId> | null = null;
  private collectionUsers: Collection<GroupIdUsers> | null = null;

  constructor() {
    this.connect = this.connect.bind(this);
    this.getGroupId = this.getGroupId.bind(this);
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

  public async migrateFields() {
    await this.connect();
    if (!this.collectionUsers) {
      return;
    }

    try {
      await this.collectionUsers.dropIndex("g_1_u_1");
    } catch {}

    try {
      await this.collectionUsers.dropIndex("g_1_s_1_f_1_p_1");
    } catch {}

    await this.collectionUsers.createIndex(
      { groupId: 1, contact: 1 },
      { unique: true }
    );

    await this.collectionUsers.createIndex({
      groupId: 1,
      sent: 1,
      failed: 1,
      processedAt: 1,
    });

    await this.collectionUsers.updateMany({ g: { $exists: true } }, [
      {
        $set: {
          groupId: { $ifNull: ["$groupId", "$g"] },
          contact: { $ifNull: ["$contact", "$u"] },
          source: { $ifNull: ["$source", ""] },
          sent: { $ifNull: ["$sent", "$s"] },
          failed: { $ifNull: ["$failed", "$f"] },
          reason: { $ifNull: ["$reason", "$r"] },
          processedAt: { $ifNull: ["$processedAt", "$p"] },
          attemptCount: { $ifNull: ["$attemptCount", "$c"] },
        },
      },
      {
        $unset: ["g", "u", "s", "f", "r", "p", "c"],
      },
    ]);
  }

  public async generateNPC(groupId: string) {
    await this.connect();
    if (!this.collectionUsers) {
      return null;
    }

    const NPC = await this.collectionUsers.findOne<GroupIdUsers>(
      {
        groupId: String(groupId),
        sent: { $ne: true },
        failed: { $ne: true },
        processedAt: { $exists: false },
      },
      {
        projection: {
          contact: 1,
          groupId: 1,
          source: 1,
          _id: 0,
        },
      }
    );

    if (NPC && NPC.contact && NPC.groupId) {
      await this.collectionUsers.updateOne(
        { groupId: NPC.groupId, contact: NPC.contact },
        {
          $set: { processedAt: new Date() },
          $inc: { attemptCount: 1 },
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

    const pipeline = [
      {
        $match: {
          target: { $ne: 0 },
          $expr: { $lt: ["$currentCount", "$target"] },
          ...(prefix?.trim()
            ? {
                groupId: {
                  $regex: `-prefix-${prefix.trim()}` + "$",
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
          _id: 0,
          history: 0,
          dateUpdated: 0,
        },
      },
    ];

    const groupId = await this.collection.aggregate(pipeline).toArray();
    return (groupId?.[0] as GroupId) || null;
  }

  public async updateGroupId(groupId: string) {
    await this.connect();
    if (!this.collection) {
      return null;
    }

    await this.collection.updateOne(
      { groupId },
      {
        $set: { target: 0 },
      }
    );
  }
}
export default new GroupIdService();

import { MongoClient, Db, Collection } from "mongodb";

import { GroupId } from "../@types/GroupId";

const dbName = "core";
const collectionName = "groupId";
const collectionNameUsers = "groupIdUsers";
const uri = process.env.DATABASE_URI || "";

class GroupIdService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<GroupId> | null = null;
  private collectionUsers: Collection<GroupId> | null = null;

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

  public async generateNPC(groupId: string) {
    await this.connect();
    if (!this.collectionUsers) {
      return null;
    }

    const NPC = await this.collectionUsers.findOne<any>(
      {
        g: String(groupId),
        s: { $ne: true },
        f: { $ne: true },
        $or: [
          { p: { $exists: false } },
          { p: null },
          {
            p: {
              $lt: new Date(
                new Date(new Date().toISOString()).getTime() - 180 * 60000
              ),
            },
          },
        ],
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
          $set: { p: new Date(new Date().toISOString()) },
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

    const pipeline = [
      {
        $match: {
          target: { $ne: 0 },
          $expr: { $lt: ["$currentCount", "$target"] },
          ...(prefix?.trim()
            ? {
                groupId: {
                  $regex: prefix.trim(),
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

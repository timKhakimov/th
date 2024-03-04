import { MongoClient } from "mongodb";

let db: any;

const DB = async () => {
  if (!db) {
    try {
      const client = new MongoClient(process.env.DATABASE_URI || "");
      const connect = await client.connect();
      db = connect.db("telethon");
    } catch (e) {
      console.error(e);
    }
  }
  return db;
};

export default DB;

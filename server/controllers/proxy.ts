import { Router } from "express";
import { Mutex } from "async-mutex";

import DB from "../db/db";

const router = Router();
const lock = new Mutex();

router.get("/", async (req, res) => {
  try {
    const collection = (await DB()).collection("proxy");

    const result = await collection
      .find({}, { projection: { database: 0 } })
      .toArray();

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

router.get("/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    await lock.acquire();
    const collection = (await DB()).collection("proxy");

    let result = await collection.findOne(
      {
        accountId,
      },
      { projection: { database: 0 } }
    );

    if (!result) {
      const proxy = await collection.findOne({
        accountId: { $exists: false },
      });
      if (proxy) {
        await collection.updateOne({ _id: proxy._id }, { $set: { accountId } });
      }

      if (proxy) {
        result = proxy;
      }
    }
    lock.release();

    res.send(result || {}).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

export default router;

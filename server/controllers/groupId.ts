import { Router } from "express";

import DB from "../db/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const collection = (await DB()).collection("groupId");

    const result = await collection
      .find({}, { projection: { database: 0 } })
      .toArray();

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const collection = (await DB()).collection("groupId");

    const result = await collection.findOne(
      {
        groupId: Number(groupId),
      },
      { projection: { database: 0 } }
    );

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

export default router;

import { Router } from "express";

import DB from "../db/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const collection = (await DB()).collection("dialogues");

    const result = await collection.find({}).toArray();

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

router.get("/:account_id/:recipient_id", async (req, res) => {
  try {
    const { account_id, recipient_id } = req.params;
    const collection = (await DB()).collection("dialogues");

    const result = await collection.findOne({
      account_id: Number(account_id),
      recipient_id: Number(recipient_id),
    });

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    body.date_updated = new Date();

    const collection = (await DB()).collection("dialogues");
    await collection.findOneAndUpdate({ id: Number(id) }, { $set: body });

    res.send("OK").status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send("ERROR").status(400);
  }
});

export default router;

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

router.get("/ping/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const pingDialogs = [];

    const collection = (await DB()).collection("dialogues");

    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 6);

    const hours24Ago = new Date();
    hours24Ago.setHours(hours24Ago.getHours() - 24);

    const dialogs = await collection
      .find({
        accountId,
        step: 3,
        ping: { $ne: true },
      })
      .toArray();

    for (const dialog of dialogs) {
      if (
        hours24Ago <= new Date(dialog.dateUpdated) &&
        new Date(dialog.dateUpdated) <= twelveHoursAgo
      ) {
        pingDialogs.push(dialog);
      }
    }

    res.send(pingDialogs).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send([]).status(400);
  }
});

router.get("/manual-control/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    const collection = (await DB()).collection("dialogues");

    const dialogs = await collection
      .find({
        accountId,
        stopped: true,
        blocked: { $ne: true },
        managerMessage: { $ne: null },
      })
      .toArray();

    res.send(dialogs).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send([]).status(400);
  }
});

router.get("/:accountId/:recipientId", async (req, res) => {
  try {
    const { accountId, recipientId } = req.params;

    const collection = (await DB()).collection("dialogues");

    const result = await collection.findOne({
      accountId,
      recipientId,
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

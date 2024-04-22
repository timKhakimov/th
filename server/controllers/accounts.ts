import { Router } from "express";

import DB from "../db/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const collection = (await DB()).collection("accounts");

    const result = await collection.find({}).toArray();

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send(null).status(400);
  }
});

router.get("/ids", async (req, res) => {
  try {
    const collection = (await DB()).collection("accounts");

    const result = await collection.distinct("accountId", {
      // banned: { $ne: true },
    });

    res.send(result).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send([]).status(400);
  }
});

router.get("/:id/random", async (req, res) => {
  try {
    const { id } = req.params;
    const collection = (await DB()).collection("accounts");
    let user;

    while (!user) {
      const randomUser = await collection
        .aggregate([
          {
            $match: {
              accountId: { $ne: id },
              banned: { $ne: true },
              setuped: true,
            },
          },
          { $sample: { size: 1 } },
        ])
        .toArray();
      user = randomUser[0];
    }

    const { firstName, lastName, username } = user;

    res.send({ firstName, lastName, username }).status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send([]).status(400);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const collection = (await DB()).collection("accounts");

    const result = await collection.findOne({ accountId: id });

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
    body["dateUpdated"] = String(new Date());

    const collection = (await DB()).collection("accounts");
    await collection.findOneAndUpdate({ accountId: id }, { $set: body });

    res.send("OK").status(200);
  } catch (e: any) {
    console.log(e.message);

    res.send("ERROR").status(400);
  }
});

export default router;

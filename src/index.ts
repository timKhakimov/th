import express, { json, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import "./env";

import GroupIdDB from "./db/groupId";
import { sendToBot } from "./modules/sendToBot";

interface RequestWithId extends Request {
  id: string;
}

type QueueItem = {
  req: RequestWithId;
  res: Response;
  groupObjectId: string;
};

type Queues = Record<string, QueueItem[]>;

const app = express();

app.use(json());
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as RequestWithId).id = requestId;

  next();
});

const queues: Queues = {};

async function processQueueForGroup(groupObjectId: string) {
  if (queues[groupObjectId] && queues[groupObjectId].length > 0) {
    const { req, res } = queues[groupObjectId].shift()!;
    const requestId = req.id;

    try {
      console.log(
        `[${requestId}] Инициирую получение NPC для groupObjectId="${groupObjectId}"`
      );
      const NPC = await GroupIdDB.generateNPC(groupObjectId);
      console.log(
        `[${requestId}] Получен NPC для groupObjectId="${groupObjectId}": ${JSON.stringify(
          NPC || "null"
        )}`
      );

      if (!NPC) {
        await GroupIdDB.updateGroupId(groupObjectId);

        for (const queue of queues[groupObjectId]) {
          queue.res.json(null);
        }
        res.json(null);
        queues[groupObjectId] = [];
      } else {
        res.json({
          source: NPC.source,
          contact: NPC.contact,
          groupObjectId,
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await sendToBot(`⚠️ ERROR_GET_NPC ⚠️
GROUP_OBJECT_ID: ${groupObjectId}
ERROR: ${error}`);
      res.json(null);
    }
  }

  setTimeout(() => processQueueForGroup(groupObjectId), 10);
}

app.get("/", async (req: Request, res: Response) => {
  const requestId = (req as RequestWithId).id;
  const { prefix } = req.query;

  try {
    console.log(`[${requestId}] Инициирую получение groupObjectId`);
    const groupObjectId = await GroupIdDB.getGroupObjectId(
      prefix ? String(prefix).trim().toLowerCase() : null
    );
    console.log(
      `[${requestId}] Получен groupObjectId: "${groupObjectId || null}"`
    );

    if (!groupObjectId) {
      return res.json("GROUP_ID_NOT_DEFINED");
    }

    if (!queues[groupObjectId]) {
      queues[groupObjectId] = [];
      processQueueForGroup(groupObjectId);
    }

    queues[groupObjectId].push({
      req: req as RequestWithId,
      res,
      groupObjectId,
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await sendToBot(`⚠️ GET_GROUPID_ERROR ⚠️
PREFIX: ${prefix}
ERROR: ${error}`);
    return res.json(null);
  }
});

app.listen(5051);

setTimeout(() => {
  process.exit(1);
}, 1000 * 60 * 30);

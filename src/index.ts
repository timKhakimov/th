import express, { json, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import "./env";

import GroupIdDB from "./db/groupId";
import { sendToBot } from "./modules/sendToBot";

interface RequestWithId extends Request {
  id: string;
}

type GroupIdData = {
  groupId: string;
  groupObjectId: string;
};

type QueueItem = {
  req: RequestWithId;
  res: Response;
  data: GroupIdData;
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

async function processQueueForGroup(groupId: string) {
  if (queues[groupId] && queues[groupId].length > 0) {
    const { req, res, data } = queues[groupId].shift()!;
    const requestId = req.id;

    try {
      console.log(
        `[${requestId}] Инициирую получение NPC для groupId="${data.groupId}"`
      );
      const NPC = await GroupIdDB.generateNPC(String(data.groupId));
      console.log(
        `[${requestId}] Получен NPC для groupId="${
          data.groupId
        }": ${JSON.stringify(NPC || "null")}`
      );

      if (!NPC) {
        await GroupIdDB.updateGroupId(groupId);

        for (const queue of queues[groupId]) {
          queue.res.json(null);
        }
        res.json(null);
        queues[groupId] = [];
      } else {
        res.json({
          source: NPC.source,
          contact: NPC.contact,
          groupId: data.groupId,
          groupObjectId: data.groupObjectId,
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await sendToBot(`⚠️ ERROR_GET_NPC ⚠️
GROUPID: ${data.groupId}
ERROR: ${error}`);
      res.json(null);
    }
  }

  setTimeout(() => processQueueForGroup(groupId), 10);
}

app.get("/", async (req: Request, res: Response) => {
  const requestId = (req as RequestWithId).id;
  const { prefix } = req.query;

  try {
    console.log(`[${requestId}] Инициирую получение groupId`);
    const data = await GroupIdDB.getGroupId(prefix ? String(prefix) : null);
    console.log(`[${requestId}] Получен groupId: "${data?.groupId || null}"`);

    if (!data || !data.groupId || !data.groupObjectId) {
      return res.json("GROUP_ID_NOT_DEFINED");
    }

    if (!queues[data.groupId]) {
      queues[data.groupId] = [];
      processQueueForGroup(data.groupId);
    }

    queues[data.groupId].push({ req: req as RequestWithId, res, data });
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

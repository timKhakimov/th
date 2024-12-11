import express, { json, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import "./env";

import GroupIdDB from "./db/groupId";

import { sendToBot } from "./modules/sendToBot";

const app = express();

app.use(json());
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as any).id = requestId;

  next();
});

const queues: any = {};

async function processQueueForGroup(groupId: string) {
  if (queues[groupId] && queues[groupId].length > 0) {
    const { req, res, data } = queues[groupId].shift();
    const requestId = (req as any).id as string;

    try {
      console.log(`[${requestId}] Инциирую получение NPC`);
      const NPC = await GroupIdDB.generateNPC(String(data.groupId));
      console.log(
        `[${requestId}] Получен NPC: ${JSON.stringify(NPC || "null")}`
      );

      if (!NPC) {
        await GroupIdDB.updateGroupId(groupId);
        await sendToBot(`💀 ЗАКОНЧИЛАСЬ БАЗА ${String(data.groupId)} 💀`);

        for (const queue of queues[groupId]) {
          queue.res.json(null);
        }
        res.json(null);
        queues[groupId] = [];
      } else {
        res.json({ groupId, username: NPC.u, ...data });
      }
    } catch {
      res.json(null);
    }
  }

  setTimeout(() => processQueueForGroup(groupId), 10);
}

app.get("/", async (req, res) => {
  const requestId = (req as any).id as string;
  const { prefix } = req.query;

  while (true) {
    try {
      console.log(`[${requestId}] Инциирую получение groupId`);
      const data = await GroupIdDB.getGroupId(prefix ? String(prefix) : null);
      console.log(`[${requestId}] Получен groupId: "${data?.groupId || null}"`);

      if (!data || !data.groupId) {
        if (prefix) {
          await sendToBot(
            `💀 НЕ НАЙДЕН СВОБОДНЫЙ ЗАПУСК С ПРЕФИКСОМ ${prefix} 💀`
          );
        } else {
          await sendToBot(`💀 НЕ НАЙДЕНЫ СВОБОДНЫЕ GROUPID 💀`);
        }
        return res.json(null);
      }

      if (!queues[data.groupId]) {
        queues[data.groupId] = [];
        processQueueForGroup(data.groupId);
      }

      queues[data.groupId].push({ req, res, data });
      break;
    } catch {
      return res.json(null);
    }
  }
});

setTimeout(() => {
  process.exit(1);
}, 1000 * 60 * 30);

app.listen(5051);

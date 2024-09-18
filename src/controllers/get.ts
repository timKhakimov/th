import { Request, Response } from "express";
import { Mutex } from "async-mutex";

import { getNPC } from "../modules/getNPC";
import { sendToBot } from "../modules/sendToBot";

const lock = new Mutex();

export const getRecipient = async (req: Request, res: Response) => {
  await lock.acquire();

  while (true) {
    try {
      const { prefix } = req.query;

      const recipientInfo = await getNPC(prefix ? String(prefix) : null);

      res.status(200).json(recipientInfo);
      break;
    } catch (error: any) {
      await sendToBot(`*** GET RECIPIENT ***
ERROR: ${error.message}`);
    }
  }

  lock.release();
};

import { Request, Response } from "express";
import { Mutex } from "async-mutex";

import { getRecipientInfo } from "../../modules/getRecipientInfo";

const lock = new Mutex();

export const getRecipient = async (_: Request, res: Response) => {
  await lock.acquire();
  while (true) {
    try {
      const recipientInfo = await getRecipientInfo();
      lock.release();
      return res.status(200).json(recipientInfo);
    } catch (error: any) {
      console.log(`GET RECIPIENT: ${error.message}`);
    }
  }
};

import { Request, Response } from "express";
import { Mutex } from "async-mutex";

import { getRecipientInfo } from "../../modules/getRecipientInfo";

const lock = new Mutex();

export const getRecipient = async (req: Request, res: Response) => {
  const { accountId, language } = req.query;

  if (!accountId || !language) {
    return res.status(400).send("AccountId or Language не передан");
  }

  await lock.acquire();
  while (true) {
    try {
      const recipientInfo = await getRecipientInfo(String(accountId), String(language));
      console.log(recipientInfo)
      lock.release();
      return res.status(200).json(recipientInfo);
    } catch (error: any) {
      console.log(error.message);
    }
  }
};

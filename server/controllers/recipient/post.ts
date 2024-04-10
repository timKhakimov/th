import { Request, Response } from "express";

import DialogueDB from "../../db/dialogue";
import GroupIdDB from "../../db/groupId";
import AccountDB from "../../db/account";
import { generateRandomTime } from "../../modules/generateRandomTime";
import { wrapPromise } from "../../modules/wrapPromise";

export const postRecipient = async (req: Request, res: Response) => {
  try {
    const { groupId, accountId, recipientId } = req.body;

    if (!groupId || !accountId || !recipientId) {
      return res.status(400).send("Недостающее количество параметров");
    }

    await Promise.all([
      wrapPromise(() => DialogueDB.postDialogue(req.body)),
      wrapPromise(() => GroupIdDB.createOrUpdateCurrentCount(groupId)),
      wrapPromise(() => AccountDB.incrementMessageCount(accountId)),
      wrapPromise(() =>
        AccountDB.updateAccountRemainingTime(accountId, generateRandomTime())
      ),
    ]);

    return res.status(200).send("OK");
  } catch (e) {
    console.log(e);
    return res.status(400).send("Произошла ошибка");
  }
};

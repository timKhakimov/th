import { Request, Response } from "express";

import DialogueDB from "../db/dialogue";
import GroupIdDB from "../db/groupId";
import AccountDB from "../db/account";
import UsernameDB from "../db/username";

import { generateRandomTime } from "../modules/generateRandomTime";
import { wrapPromise } from "../modules/wrapPromise";

export const postRecipient = async (req: Request, res: Response) => {
  try {
    const { groupId, accountId, recipientId, status, username } = req.body;

    if (status === "mini-update") {
      if (!accountId || !recipientId) {
        return res.status(400).send("Недостающее количество параметров");
      }

      await wrapPromise(() => DialogueDB.postDialogue(req.body));
      return res.status(200).send("OK");
    }
    if (status === "error") {
      if (!username) {
        return res.status(400).send("Недостающее количество параметров");
      }

      await wrapPromise(() =>
        UsernameDB.updateUsername(username, {
          failed: true,
          dateUpdated: new Date(),
        })
      );

      return res.status(200).send("OK");
    }

    if (!groupId || !accountId || !recipientId || !status) {
      return res.status(400).send("Недостающее количество параметров");
    }

    await Promise.all([
      wrapPromise(() => DialogueDB.postDialogue(req.body)),
      wrapPromise(() =>
        status === "create"
          ? GroupIdDB.createOrUpdateCurrentCount(groupId)
          : Promise.resolve()
      ),
      wrapPromise(() =>
        status === "create"
          ? AccountDB.incrementMessageCount(accountId)
          : Promise.resolve()
      ),
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

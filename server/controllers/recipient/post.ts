import { Request, Response } from "express";

import DialogueDB from "../../db/dialogue";
import GroupIdDB from "../../db/groupId";
import UsernameDB from "../../db/username";
import AccountDB from "../../db/account";
import { generateRandomTime } from "../../modules/generateRandomTime";
import { wrapPromise } from "../../modules/wrapPromise";

export const postRecipient = async (req: Request, res: Response) => {
  try {
    const { status, group_id, account_id, dialogue } = req.body;

    if (!account_id) {
      return res
        .status(400)
        .send("Недостающее количество параметров - account_id");
    }

    if (status === "remaining_time") {
      await wrapPromise(() =>
        AccountDB.updateAccountRemainingTime(account_id, generateRandomTime())
      );
      return res.status(200).send("OK");
    }

    if (!status || !group_id) {
      return res.status(400).send("Недостающее количество параметров");
    }

    if (status === "done") {
      if (!dialogue || !dialogue.account_id || !dialogue.recipient_id) {
        return res.status(400).send("Недостающее количество параметров");
      }

      await Promise.all([
        wrapPromise(() => DialogueDB.postDialogue(dialogue)),

        wrapPromise(() => GroupIdDB.createOrUpdateCurrentCount(group_id)),
        wrapPromise(() => AccountDB.incrementMessageCount(account_id)),
        wrapPromise(() =>
          AccountDB.updateAccountRemainingTime(account_id, generateRandomTime())
        ),
      ]);
    }

    return res.status(200).send("OK");
  } catch (e) {
    console.log(e);
    return res.status(400).send("Произошла ошибка");
  }
};

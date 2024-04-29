import GroupIdDB from "../db/groupId";
import UsernameDB from "../db/username";
import DialogueDB from "../db/dialogue";
import { processAccounts } from "../store";
import { recipientSaturation } from "./recipientSaturation";
import { wrapPromise } from "./wrapPromise";

export const getRecipientInfo = async () => {
  console.log("Начал генерировать информацию о пользователе");
  const response = await GroupIdDB.getGroupId();

  const {
    groupId = 12343207729,
    database = [],
    offer,
  } = response ?? ({} as any);

  console.log(`Сгенерированный groupId: ${groupId}`);
  const [failedUsers, usersSender] = await Promise.all([
    UsernameDB.getFailedUsernames(),
    DialogueDB.getUsernamesByGroupId(groupId),
  ]);

  for (let i = 0; i < database.length; i++) {
    const username = database[i].toLowerCase();

    if (
      !usersSender.includes(username) &&
      !failedUsers.includes(username) &&
      !processAccounts.includes(username)
    ) {
      if (!processAccounts.includes(username)) {
        processAccounts.push(username);
        console.log(
          `Username ${username} для groupId ${groupId} сгенерирован из локальной базы`
        );
        const user = await recipientSaturation({
          username: 'ignatevPavel',
          groupId,
          offer,
        });

        if (user) {
          return user;
        }

        await wrapPromise(() =>
          UsernameDB.updateMessage(username, {
            failed: true,
            dateUpdated: new Date(),
          })
        );
      }
    }
  }

  console.log(`Закончилась база у ${groupId}`);
  return null;
};

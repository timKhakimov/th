import GroupIdDB from "../db/groupId";

import groupId from "../db/groupId";

import { GroupId } from "../@types/GroupId";
import { sendToBot } from "./sendToBot";

export const getNPC = async (prefix: string | null) => {
  console.log(
    `*** Started generating user ${prefix ? `for prefix "${prefix}"` : ""} ***`
  );
  let NPC: { g: string; u: string } | null = null;
  let result: GroupId | null = null;

  while (!NPC) {
    let response = await GroupIdDB.getGroupId(prefix);

    if (!response && prefix) {
      await sendToBot(`💀💀💀 НЕ НАЙДЕН GROUPID ПО ПРЕФИКСУ ${prefix} 💀💀💀`);
      response = await GroupIdDB.getGroupId(null);
    }

    if (!response) {
      await new Promise((res) => setTimeout(res, 5000));
      await sendToBot(`💀💀💀 НЕ НАЙДЕНЫ СВОБОДНЫЕ GROUPID 💀💀💀`);
      continue;
    }

    console.log("Generated groupId:", response.groupId);
    NPC = await GroupIdDB.generateNPC(String(response.groupId));

    if (!NPC) {
      await new Promise((res) => setTimeout(res, 5000));
      await sendToBot(
        `💀💀💀 ЗАКОНЧИЛАСЬ БАЗА У **${response.groupId}** 💀💀💀`
      );
      continue;
    }

    result = response;
  }

  if (!result || !result.groupId) {
    await sendToBot(`💀💀💀 НЕ НАЙДЕНЫ GROUPID ДЛЯ УВЕЛИЧЕНИЯ TARGET 💀💀💀`);
  } else {
    GroupIdDB.incrementCurrentTargetByGroupId(String(result.groupId));
  }

  console.log(`*** Generated user ${NPC.u} ***`);
  return { groupId, username: NPC.u, ...result };
};

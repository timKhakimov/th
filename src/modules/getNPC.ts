import GroupIdDB from "../db/groupId";

import groupId from "../db/groupId";

import { GroupId } from "../@types/GroupId";
import { sendToBot } from "./sendToBot";

export const getNPC = async () => {
  console.log("*** Started generating user ***");
  let NPC: { g: number; u: string } | null = null;
  let result: GroupId | null = null;

  while (!NPC) {
    let response: GroupId | null = null;
    while (!response) {
      response = await GroupIdDB.getGroupId();
    }
    console.log("Generated groupId:", response.groupId);

    NPC = await GroupIdDB.generateNPC(Number(response.groupId));
    result = response;

    if (!NPC) {
      await sendToBot(
        `💀💀💀 ЗАКОНЧИЛАСЬ БАЗА У **${response.groupId}** 💀💀💀`
      );
    }
  }

  GroupIdDB.incrementCurrentTargetByGroupId(Number(result?.groupId));

  console.log(`*** Generated user ${NPC.u} ***`);

  return { groupId, username: NPC.u, ...result };
};

import { Router } from "express";

import accountRouter from "./controllers/accounts";
import dialoguesRouter from "./controllers/dialogues";
import groupIdRouter from "./controllers/groupId";
import proxyRouter from "./controllers/proxy";

import { getRecipient, postRecipient } from "./controllers/recipient";

const mainRouter: Router = Router();

mainRouter.get("/recipient", getRecipient);
mainRouter.post("/recipient", postRecipient);
mainRouter.use("/accounts", accountRouter);
mainRouter.use("/dialogues", dialoguesRouter);
mainRouter.use("/groupid", groupIdRouter);
mainRouter.use("/proxy", proxyRouter);

export { mainRouter };

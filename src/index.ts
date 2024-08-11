import express, { json } from "express";

import "./env";

import GroupIdDB from "./db/groupId";

import { getRecipient } from "./controllers";

const app = express();

app.use(json());

app.get("/", getRecipient);

app.listen(5051, async () => {
  console.log(
    `Application successfully launched on port http://localhost:5051`
  );
});

setTimeout(() => {
  process.exit(1);
}, 1000 * 60 * 10);
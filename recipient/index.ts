import express, { json } from "express";

import "./env";
import { getRecipient, postRecipient } from "./controllers";

const app = express();

app.use(json());

app.get("/", getRecipient);
app.post("/", postRecipient);

app.listen(5051, () => {
  console.log(`Приложение успешно запущен на порту 5051`);
});

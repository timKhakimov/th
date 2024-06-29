import express, { json } from "express";

import "./env";
import { getRecipient } from "./controllers";

const app = express();

app.use(json());

app.get("/", getRecipient);

app.listen(5051, () => {
  console.log(`Приложение успешно запущен на порту 5051`);
});

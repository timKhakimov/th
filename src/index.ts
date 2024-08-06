import express, { json } from "express";

import "./env";
import { getRecipient } from "./controllers";

const app = express();

app.use(json());

app.get("/", getRecipient);

app.listen(5051, () => {
  console.log(`Приложение успешно запущен на порту http://localhost:5051`);
});

setTimeout(() => {
  process.exit(1);
}, 1000 * 60 * 30);

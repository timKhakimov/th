import "./env";
import express from "express";

import { PORT } from "./config";
import { mainRouter } from "./router";
import { setupMiddlewares } from "./middlewares/index";

const app = express();

setupMiddlewares(app);

app.use("/", mainRouter);

app.listen(PORT, () => {
  console.log(`Приложение успешно запущен на порту ${PORT}`);
});

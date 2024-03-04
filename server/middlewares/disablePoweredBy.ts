import { Request, Response, NextFunction } from "express";

export const disablePoweredBy = (
  _: Request,
  res: Response,
  next: NextFunction
): void => {
  res.removeHeader("X-Powered-By");

  next();
};

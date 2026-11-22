import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import "./common/types";

import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { rolesRouter } from "./modules/roles/roles.routes";
import { leadSourcesRouter } from "./modules/leadSources/leadSources.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { productsRouter } from "./modules/products/products.routes";
import { leadsRouter } from "./modules/leads/leads.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { reportsRouter, exportRouter } from "./modules/reports/reports.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { searchRouter } from "./modules/search/search.routes";
import { followUpsRouter } from "./modules/followups/followups.routes";
import { teamRouter } from "./modules/team/team.routes";

export const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxy > 0) app.set("trust proxy", env.trustProxy);
  // Quote PDFs are opened from the web app's origin, so allow cross-origin reads.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req: Request, res: Response) => res.json({ success: true, data: { status: "ok", uptime: process.uptime() } }));

  app.use("/uploads", express.static(path.resolve(env.uploadDir)));

  const api = express.Router();
  api.use(apiLimiter);
  api.use("/auth", authRouter);
  api.use("/users", usersRouter);
  api.use("/roles", rolesRouter);
  api.use("/lead-sources", leadSourcesRouter);
  api.use("/customers", customersRouter);
  api.use("/products", productsRouter);
  api.use("/leads", leadsRouter);
  api.use("/dashboard", dashboardRouter);
  api.use("/reports", reportsRouter);
  api.use("/export", exportRouter);
  api.use("/notifications", notificationsRouter);
  api.use("/settings", settingsRouter);
  api.use("/search", searchRouter);
  api.use("/followups", followUpsRouter);
  api.use("/team", teamRouter);

  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

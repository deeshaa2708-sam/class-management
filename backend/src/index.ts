import "express-async-errors";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { env } from "./config/env";
import { prisma } from "./config/database";
import { initSocket } from "./socket";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(env.upload.dir)));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", routes);

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  await prisma.$connect();
  console.log("[DB] Connected to database");

  initSocket(httpServer);
  console.log("[WS] Socket.io initialised");

  httpServer.listen(env.port, () => {
    console.log(`[HTTP] Server running on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

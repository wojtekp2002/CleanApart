import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", authRoutes);
  app.use("/groups", groupRoutes);

  return app;
};

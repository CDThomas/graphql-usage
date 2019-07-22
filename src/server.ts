import express from "express";
import path from "path";

import { Report } from "./report";

function createServer(stats: Report) {
  const app = express();

  app.use(express.static(path.resolve(__dirname, "../build")));

  app.get("/stats", (_req, res) => {
    res.json(stats);
  });

  return app;
}

export default createServer;

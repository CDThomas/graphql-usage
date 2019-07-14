import express from "express";
import { Report } from "./report";

function createServer(stats: Report) {
  const app = express();

  app.get("/stats", (req, res) => {
    res.json(stats);
  });

  return app;
}

export default createServer;

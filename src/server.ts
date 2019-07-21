import express from "express";
import { Report } from "./report";
import path from "path";

function createServer(stats: Report) {
  const app = express();

  app.use(express.static(path.resolve(__dirname, "../graphql-usage-ui/build")));

  app.get("/stats", (req, res) => {
    res.json(stats);
  });

  return app;
}

export default createServer;

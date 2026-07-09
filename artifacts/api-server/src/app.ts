import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Railway (and most PaaS providers) sit behind a reverse proxy.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ---------------------------------------------------------------------------
// Serve the built frontend (artifacts/aerovaultt) as static assets, if present.
//
// This lets the API server and the web app be deployed as a single Railway
// service on one origin, so the frontend's relative "/api/..." fetch calls
// work without any CORS or base-URL configuration.
// ---------------------------------------------------------------------------
const clientDistDir = path.resolve(__dirname, "../../aerovaultt/dist/public");

if (fs.existsSync(clientDistDir)) {
  app.use(
    express.static(clientDistDir, {
      index: false,
      maxAge: "1y",
      setHeaders(res, filePath) {
        // Never cache the HTML shell itself, only fingerprinted assets.
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // SPA fallback: any non-API GET request that isn't a static file resolves
  // to index.html so client-side routing (wouter) can take over.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistDir, "index.html"));
  });
} else {
  logger.warn(
    { clientDistDir },
    "Frontend build output not found; API server will not serve static assets.",
  );
}

export default app;

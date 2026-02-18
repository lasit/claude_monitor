import express from "express";
import { config } from "./config.js";
import { warmUpCache } from "./cache/warm-up.js";
import dailyRoutes from "./routes/daily.js";
import monthlyRoutes from "./routes/monthly.js";
import sessionsRoutes from "./routes/sessions.js";
import blocksRoutes from "./routes/blocks.js";
import metaRoutes from "./routes/meta.js";
import subscriptionRoutes from "./routes/subscription.js";

const app = express();

app.use(express.json());

// API routes
app.use("/api/daily", dailyRoutes);
app.use("/api/monthly", monthlyRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/blocks", blocksRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`[server] Claude Monitor API running on http://localhost:${config.port}`);
  // Fire and forget cache warm-up
  warmUpCache().catch((err) => {
    console.error("[server] Cache warm-up failed:", err);
  });
});

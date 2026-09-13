const express = require("express");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_URL = process.env.UID_API_URL || "https://api.gameskinbo.com/ff-info/get";
const API_KEY = (process.env.UID_API_KEY || "").trim();

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute." }
});

app.post("/api/check-uid", limiter, async (req, res) => {
  const uid = String(req.body?.uid || "").trim();
  const region = String(req.body?.region || "").trim().toUpperCase();

  if (!/^\d{5,20}$/.test(uid)) {
    return res.status(400).json({ error: "Enter a valid Free Fire UID." });
  }

  const allowedRegions = ["BD","IND","BR","US","SAC","NA","TH","ID","SG","PK"];
  if (region && !allowedRegions.includes(region)) {
    return res.status(400).json({ error: "Unsupported region." });
  }

  if (!API_KEY || API_KEY === "PASTE_YOUR_API_KEY_HERE") {
    return res.status(503).json({
      error: "API key is not configured. Put your Games Kinbo API key in .env and restart the server."
    });
  }

  const url = new URL(API_URL);
  url.searchParams.set("uid", uid);
  if (region) url.searchParams.set("region", region);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json", "x-api-key": API_KEY },
      signal: controller.signal
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text || "Invalid API response." }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    return res.json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "API request timed out. Try again." });
    }
    return res.status(502).json({ error: "Could not connect to Games Kinbo API." });
  } finally {
    clearTimeout(timeout);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    apiConfigured: Boolean(API_KEY && API_KEY !== "PASTE_YOUR_API_KEY_HERE")
  });
});

app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("========================================");
  console.log(" Free Fire UID Checker");
  console.log("========================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API key: ${API_KEY && API_KEY !== "PASTE_YOUR_API_KEY_HERE" ? "CONFIGURED" : "NOT CONFIGURED"}`);
  console.log("========================================");
});

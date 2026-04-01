import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { checkDbConnection } from "./server/db";

// Routes
import clientRoutes from "./server/routes/clients";
import taskRoutes from "./server/routes/tasks";
import dashboardRoutes from "./server/routes/dashboard";
import documentRoutes from "./server/routes/documents";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api/clients", clientRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/documents", documentRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FAMS API is running with Supabase" });
  });

  // Check database connection
  const dbConnected = await checkDbConnection();
  if (!dbConnected) {
    console.warn("Warning: Database connection could not be established. Some features may be unavailable.");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } catch (e) {
      console.error("Failed to start Vite:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

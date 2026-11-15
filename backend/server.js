
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();

// ==================================
// MIDDLEWARE
// ==================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================
// API ROUTES
// ==================================

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// ==================================
// HOME ROUTE
// ==================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TaskFlow API"
  });
});

// ==================================
// HEALTH CHECK
// ==================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TaskFlow server is running"
  });
});

// ==================================
// START SERVER
// ==================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

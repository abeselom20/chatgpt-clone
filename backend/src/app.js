import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ChatGPT Clone API is running");
});

app.use("/api/chat", chatRoutes);

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler — must be registered last
app.use(errorHandler);

export default app;

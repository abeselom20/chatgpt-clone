import { Router } from "express";
import {
  getConversations,
  createConversation,
} from "../controllers/chatController.js";

const router = Router();

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);

export default router;

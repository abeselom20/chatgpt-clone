import { pool } from "../config/db.js";
import { getAssistantReply } from "../services/aiService.js";
import { ValidationError, DatabaseError } from "../utils/AppError.js";

const getMessageById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, role, content, token_count FROM conversations WHERE id = ?",
    [id],
  );
  return rows[0];
};

export const getConversations = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, role, content, token_count FROM conversations ORDER BY created_at ASC, id ASC",
    );

    res.status(200).json({
      success: true,
      message: "Conversations loaded successfully.",
      data: { conversations: rows },
    });
  } catch (error) {
    next(new DatabaseError("Failed to load conversations."));
  }
};

export const createConversation = async (req, res, next) => {
  const { question } = req.body;

  if (typeof question !== "string" || !question.trim()) {
    return next(
      new ValidationError(
        "The 'question' field is required and must be a non-empty string.",
      ),
    );
  }

  const trimmedQuestion = question.trim();

  const HISTORY_LIMIT = Number(process.env.GEMINI_HISTORY_LIMIT) || 5;
  let history = [];

  try {
    // Fetched BEFORE inserting the new question below, so it naturally
    // excludes the question we're about to answer.
    const [historyRows] = await pool.query(
      "SELECT role, content FROM conversations ORDER BY created_at DESC, id DESC LIMIT ?",
      [HISTORY_LIMIT],
    );
    history = historyRows.reverse(); // back into chronological order
  } catch (error) {
    console.error("Failed to load conversation history:", error.message);
  }

  let userConversation;

  try {
    const [userResult] = await pool.query(
      "INSERT INTO conversations (role, content) VALUES (?, ?)",
      ["user", trimmedQuestion],
    );
    userConversation = await getMessageById(userResult.insertId);
  } catch (error) {
    return next(new DatabaseError("Failed to save your question."));
  }

  try {
    const { content: assistantContent, tokenCount } = await getAssistantReply(
      trimmedQuestion,
      history,
    );

    const [assistantResult] = await pool.query(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", assistantContent, tokenCount],
    );

    const assistantConversation = await getMessageById(
      assistantResult.insertId,
    );

    res.status(201).json({
      success: true,
      message: "Conversation posted successfully.",
      data: { userConversation, assistantConversation },
    });
  } catch (error) {
    // AIProviderError (502) or DatabaseError (500) — already has the right statusCode/message
    next(error);
  }
};

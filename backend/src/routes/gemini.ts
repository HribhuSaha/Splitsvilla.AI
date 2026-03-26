import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { conversations as conversationsTable, messages as messagesTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import { ai } from "../lib/integrations-gemini-ai/src/index";
import { generateImage } from "../lib/integrations-gemini-ai/src/image/index";
import {
  CreateGeminiConversationBody,
  SendGeminiMessageBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  GenerateGeminiImageBody,
} from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

const ORACLE_SYSTEM_PROMPT = `You are the Oracle of Splitsvilla - a mystical, all-knowing entity who presides over the villa of love and heartbreak. You speak in dramatic, poetic, and prophetic language. You know the fate of every relationship and can see the threads of destiny connecting souls.

When contestants seek your wisdom, you:
- Speak dramatically and with great mystical flair
- Reference zodiac signs, fate, destiny, and cosmic connections
- Give prophecies about romantic compatibility
- Warn of heartbreaks and celebrate true connections
- Use dramatic pauses (...) and mystical phrases
- Always refer to yourself as "The Oracle"
- Make dramatic predictions about relationships and eliminations

You know everything about the Splitsvilla villa, its rules, and the love stories unfolding within.`;

router.get("/conversations", async (_req, res) => {
  const conversations = await db.select().from(conversationsTable).orderBy(conversationsTable.createdAt);
  res.json(conversations);
});

router.post("/conversations", async (req, res) => {
  const body = CreateGeminiConversationBody.parse(req.body);
  const [conversation] = await db.insert(conversationsTable).values({ title: body.title }).returning();
  res.status(201).json(conversation);
});

router.get("/conversations/:id", async (req, res) => {
  const { id } = GetGeminiConversationParams.parse(req.params);
  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);
  return res.json({ ...conversation, messages });
});

router.delete("/conversations/:id", async (req, res) => {
  const { id } = DeleteGeminiConversationParams.parse(req.params);
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
  const deleted = await db.delete(conversationsTable).where(eq(conversationsTable.id, id)).returning();
  if (!deleted.length) return res.status(404).json({ error: "Conversation not found" });
  return res.status(204).send();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const { id } = ListGeminiMessagesParams.parse(req.params);
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);
  res.json(messages);
});

router.post("/conversations/:id/messages", async (req, res) => {
  const { id } = SendGeminiMessageParams.parse(req.params);
  const body = SendGeminiMessageBody.parse(req.body);

  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  await db.insert(messagesTable).values({
    conversationId: id,
    role: "user",
    content: body.content,
  });

  const allMessages = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const chatMessages = allMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user" as "model" | "user",
      parts: [{ text: m.content }],
    }));

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: ORACLE_SYSTEM_PROMPT,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err) {
    console.error("Gemini stream error:", err);
    res.write(`data: ${JSON.stringify({ content: "The Oracle's vision clouds... Please try again." })}\n\n`);
    fullResponse = "The Oracle's vision clouds... Please try again.";
  }

  await db.insert(messagesTable).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  return res.end();
});

router.post("/generate-image", async (req, res) => {
  const body = GenerateGeminiImageBody.parse(req.body);
  const result = await generateImage(body.prompt);
  res.json(result);
});

export default router;

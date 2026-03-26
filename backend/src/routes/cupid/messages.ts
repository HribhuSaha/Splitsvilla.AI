import { Router, type IRouter } from "express";
import { db, cupidMatchesTable, cupidMessagesTable } from "../../lib/db/src/index";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/matches/:matchId/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { matchId } = req.params;
  const userId = req.user.id;

  const match = await db.query.cupidMatchesTable.findFirst({
    where: eq(cupidMatchesTable.id, matchId),
  });
  if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = await db.query.cupidMessagesTable.findMany({
    where: eq(cupidMessagesTable.matchId, matchId),
    orderBy: [asc(cupidMessagesTable.createdAt)],
  });

  res.json(messages);
});

router.post("/matches/:matchId/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { matchId } = req.params;
  const userId = req.user.id;

  const match = await db.query.cupidMatchesTable.findFirst({
    where: eq(cupidMatchesTable.id, matchId),
  });
  if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (match.womenMustMessageFirst) {
    const existingMessage = await db.query.cupidMessagesTable.findFirst({
      where: eq(cupidMessagesTable.matchId, matchId),
    });
    if (!existingMessage) {
      const now = new Date();
      if (match.messageDeadline && now > match.messageDeadline) {
        res.status(403).json({ error: "Message deadline has passed" });
        return;
      }
      if (match.womanId !== userId) {
        res.status(403).json({ error: "Waiting for them to say hello first" });
        return;
      }
    }
  }

  const { content, encryptedContent, iv, encryptedKeyForSender, encryptedKeyForRecipient } = req.body;

  const isE2ee = encryptedContent && iv && encryptedKeyForSender && encryptedKeyForRecipient;
  const isPlain = content && typeof content === "string" && content.trim().length > 0;

  if (!isE2ee && !isPlain) {
    res.status(400).json({ error: "Message must include either content or encrypted fields" });
    return;
  }

  const [message] = await db
    .insert(cupidMessagesTable)
    .values({
      matchId,
      senderId: userId,
      content: isE2ee ? null : content,
      encryptedContent: isE2ee ? encryptedContent : null,
      iv: isE2ee ? iv : null,
      encryptedKeyForSender: isE2ee ? encryptedKeyForSender : null,
      encryptedKeyForRecipient: isE2ee ? encryptedKeyForRecipient : null,
    })
    .returning();

  res.status(201).json(message);
});

export default router;

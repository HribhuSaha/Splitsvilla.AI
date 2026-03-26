import { Router, type IRouter } from "express";
import { db, cupidMatchesTable, cupidProfilesTable, cupidMessagesTable } from "../../lib/db/src/index";
import { or, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/matches", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const matches = await db.query.cupidMatchesTable.findMany({
    where: or(eq(cupidMatchesTable.user1Id, userId), eq(cupidMatchesTable.user2Id, userId)),
    orderBy: [desc(cupidMatchesTable.createdAt)],
  });

  const result = await Promise.all(
    matches.map(async (match) => {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherProfile = await db.query.cupidProfilesTable.findFirst({
        where: eq(cupidProfilesTable.userId, otherUserId),
      });

      const lastMessage = await db.query.cupidMessagesTable.findFirst({
        where: eq(cupidMessagesTable.matchId, match.id),
        orderBy: [desc(cupidMessagesTable.createdAt)],
      });

      const now = new Date();
      let canMessage = true;
      if (match.womenMustMessageFirst) {
        const hasMessages = !!lastMessage;
        if (!hasMessages) {
          if (match.womanId === userId) {
            canMessage = true;
          } else {
            canMessage = false;
          }
          if (match.messageDeadline && now > match.messageDeadline) {
            canMessage = false;
          }
        }
      }

      return {
        id: match.id,
        otherProfile,
        womenMustMessageFirst: match.womenMustMessageFirst,
        messageDeadline: match.messageDeadline?.toISOString() ?? null,
        canMessage,
        lastMessage: lastMessage ?? null,
        createdAt: match.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

export default router;

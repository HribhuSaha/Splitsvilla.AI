import { Router, type IRouter } from "express";
import { db, cupidSwipesTable, cupidMatchesTable, cupidProfilesTable } from "../../lib/db/src/index";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createSwipeSchema = z.object({
  targetUserId: z.string(),
  direction: z.enum(["like", "pass"]),
});

router.post("/swipes", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = createSwipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { targetUserId, direction } = parsed.data;

  await db
    .insert(cupidSwipesTable)
    .values({ swiperId: req.user.id, targetId: targetUserId, direction })
    .onConflictDoNothing();

  if (direction !== "like") {
    res.json({ matched: false, matchId: null });
    return;
  }

  const theirSwipe = await db.query.cupidSwipesTable.findFirst({
    where: and(
      eq(cupidSwipesTable.swiperId, targetUserId),
      eq(cupidSwipesTable.targetId, req.user.id),
      eq(cupidSwipesTable.direction, "like")
    ),
  });

  if (!theirSwipe) {
    res.json({ matched: false, matchId: null });
    return;
  }

  const existing = await db.query.cupidMatchesTable.findFirst({
    where: and(
      eq(cupidMatchesTable.user1Id, req.user.id),
      eq(cupidMatchesTable.user2Id, targetUserId)
    ),
  });
  if (existing) {
    res.json({ matched: true, matchId: existing.id });
    return;
  }

  const myProfile = await db.query.cupidProfilesTable.findFirst({
    where: eq(cupidProfilesTable.userId, req.user.id),
  });
  const theirProfile = await db.query.cupidProfilesTable.findFirst({
    where: eq(cupidProfilesTable.userId, targetUserId),
  });

  let womenMustMessageFirst = false;
  let womanId: string | null = null;
  let messageDeadline: Date | null = null;

  if (myProfile && theirProfile) {
    const genders = [myProfile.gender, theirProfile.gender];
    const hasMale = genders.includes("male");
    const hasFemale = genders.includes("female");
    if (hasMale && hasFemale) {
      womenMustMessageFirst = true;
      womanId = myProfile.gender === "female" ? req.user.id : targetUserId;
      messageDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  const [match] = await db
    .insert(cupidMatchesTable)
    .values({
      user1Id: req.user.id,
      user2Id: targetUserId,
      womenMustMessageFirst,
      womanId,
      messageDeadline,
    })
    .returning();

  res.json({ matched: true, matchId: match.id });
});

export default router;

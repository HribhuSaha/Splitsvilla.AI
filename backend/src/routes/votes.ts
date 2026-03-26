import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { votesTable, contestantsTable, eventsTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import { CastVoteBody } from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const votes = await db.select().from(votesTable).orderBy(votesTable.createdAt);
  const contestants = await db.select().from(contestantsTable);
  const contestantMap = new Map(contestants.map(c => [c.id, c]));

  const result = votes.map(v => ({
    ...v,
    voterName: contestantMap.get(v.voterContestantId)?.name ?? "Unknown",
    nominatedName: contestantMap.get(v.nominatedContestantId)?.name ?? "Unknown",
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CastVoteBody.parse(req.body);

  const [voter] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.voterContestantId));
  const [nominated] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.nominatedContestantId));

  if (!voter || !nominated) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  const [vote] = await db.insert(votesTable).values({
    voterContestantId: body.voterContestantId,
    nominatedContestantId: body.nominatedContestantId,
    reason: body.reason ?? null,
    round: body.round,
  }).returning();

  await db.insert(eventsTable).values({
    type: "vote_cast",
    title: `${voter.name} voted to dump ${nominated.name}`,
    description: `${voter.name} nominated ${nominated.name} for elimination in round ${body.round}.${body.reason ? ` Reason: ${body.reason}` : ""}`,
    relatedContestantIds: `${body.voterContestantId},${body.nominatedContestantId}`,
  });

  return res.status(201).json({
    ...vote,
    voterName: voter.name,
    nominatedName: nominated.name,
  });
});

export default router;

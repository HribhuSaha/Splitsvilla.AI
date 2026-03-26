import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { splitsTable, contestantsTable, eventsTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import {
  CreateSplitBody,
  DeleteSplitParams,
} from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const splits = await db.select().from(splitsTable).orderBy(splitsTable.id);
  const contestants = await db.select().from(contestantsTable);
  const contestantMap = new Map(contestants.map(c => [c.id, c]));

  const result = splits.map(s => ({
    ...s,
    contestant1Name: contestantMap.get(s.contestant1Id)?.name ?? "Unknown",
    contestant2Name: contestantMap.get(s.contestant2Id)?.name ?? "Unknown",
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateSplitBody.parse(req.body);

  const contestants = await db.select().from(contestantsTable).where(
    eq(contestantsTable.id, body.contestant1Id)
  );
  const c2 = await db.select().from(contestantsTable).where(
    eq(contestantsTable.id, body.contestant2Id)
  );

  if (!contestants[0] || !c2[0]) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  const [split] = await db.insert(splitsTable).values({
    contestant1Id: body.contestant1Id,
    contestant2Id: body.contestant2Id,
    status: "active",
  }).returning();

  await db.update(contestantsTable)
    .set({ currentSplitId: split.id })
    .where(eq(contestantsTable.id, body.contestant1Id));
  await db.update(contestantsTable)
    .set({ currentSplitId: split.id })
    .where(eq(contestantsTable.id, body.contestant2Id));

  await db.insert(eventsTable).values({
    type: "split_formed",
    title: `${contestants[0].name} & ${c2[0].name} coupled up!`,
    description: `A new connection has been formed between ${contestants[0].name} and ${c2[0].name}.`,
    relatedContestantIds: `${body.contestant1Id},${body.contestant2Id}`,
    relatedSplitId: split.id,
  });

  return res.status(201).json({
    ...split,
    contestant1Name: contestants[0].name,
    contestant2Name: c2[0].name,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteSplitParams.parse(req.params);
  const [split] = await db.select().from(splitsTable).where(eq(splitsTable.id, id));
  if (split) {
    const c1 = await db.select().from(contestantsTable).where(eq(contestantsTable.id, split.contestant1Id));
    const c2 = await db.select().from(contestantsTable).where(eq(contestantsTable.id, split.contestant2Id));
    await db.update(splitsTable).set({ status: "broken" }).where(eq(splitsTable.id, id));
    await db.update(contestantsTable).set({ currentSplitId: null }).where(eq(contestantsTable.id, split.contestant1Id));
    await db.update(contestantsTable).set({ currentSplitId: null }).where(eq(contestantsTable.id, split.contestant2Id));

    await db.insert(eventsTable).values({
      type: "split_broken",
      title: `${c1[0]?.name ?? "Unknown"} & ${c2[0]?.name ?? "Unknown"} split up!`,
      description: `The connection between ${c1[0]?.name ?? "Unknown"} and ${c2[0]?.name ?? "Unknown"} has been broken.`,
      relatedContestantIds: `${split.contestant1Id},${split.contestant2Id}`,
      relatedSplitId: split.id,
    });
  }
  res.status(204).send();
});

export default router;

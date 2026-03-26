import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { contestantsTable, eventsTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import {
  CreateContestantBody,
  GetContestantParams,
  UpdateContestantParams,
  UpdateContestantBody,
  DeleteContestantParams,
} from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const contestants = await db.select().from(contestantsTable).orderBy(contestantsTable.id);
  res.json(contestants);
});

router.post("/", async (req, res) => {
  const body = CreateContestantBody.parse(req.body);
  const [contestant] = await db.insert(contestantsTable).values({
    name: body.name,
    age: body.age,
    hometown: body.hometown,
    bio: body.bio,
    zodiacSign: body.zodiacSign,
    personality: body.personality,
    interests: body.interests,
    gender: body.gender,
    status: "active",
  }).returning();

  await db.insert(eventsTable).values({
    type: "contestant_joined",
    title: `${contestant.name} entered the Villa!`,
    description: `${contestant.name}, age ${contestant.age}, from ${contestant.hometown} has joined as a new contestant.`,
    relatedContestantIds: String(contestant.id),
  });

  res.status(201).json(contestant);
});

router.get("/:id", async (req, res) => {
  const { id } = GetContestantParams.parse(req.params);
  const [contestant] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, id));
  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }
  return res.json(contestant);
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateContestantParams.parse(req.params);
  const body = UpdateContestantBody.parse(req.body);
  const [contestant] = await db.update(contestantsTable)
    .set({
      name: body.name,
      age: body.age,
      hometown: body.hometown,
      bio: body.bio,
      zodiacSign: body.zodiacSign,
      personality: body.personality,
      interests: body.interests,
      gender: body.gender,
    })
    .where(eq(contestantsTable.id, id))
    .returning();
  if (!contestant) {
    return res.status(404).json({ error: "Contestant not found" });
  }
  return res.json(contestant);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteContestantParams.parse(req.params);
  await db.delete(contestantsTable).where(eq(contestantsTable.id, id));
  res.status(204).send();
});

export default router;

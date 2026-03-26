import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { eventsTable } from "../lib/db/src/schema/index";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const events = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt)).limit(50);
  res.json(events);
});

export default router;

import { Router, type IRouter } from "express";
import { db, cupidPublicKeysTable } from "../../lib/db/src/index";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.put("/keys/public-key", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { publicKey } = req.body;
  if (!publicKey || typeof publicKey !== "string") {
    res.status(400).json({ error: "publicKey is required" });
    return;
  }

  const [record] = await db
    .insert(cupidPublicKeysTable)
    .values({ userId: req.user.id, publicKey, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: cupidPublicKeysTable.userId,
      set: { publicKey, updatedAt: new Date() },
    })
    .returning();

  res.json({ userId: record.userId, publicKey: record.publicKey, createdAt: record.createdAt });
});

router.get("/keys/public-key/:userId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = req.params;
  const record = await db.query.cupidPublicKeysTable.findFirst({
    where: eq(cupidPublicKeysTable.userId, userId),
  });
  if (!record) {
    res.status(404).json({ error: "Public key not found" });
    return;
  }
  res.json({ userId: record.userId, publicKey: record.publicKey, createdAt: record.createdAt });
});

export default router;

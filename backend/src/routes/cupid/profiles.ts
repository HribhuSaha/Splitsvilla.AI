import { Router, type IRouter } from "express";
import { db, cupidProfilesTable, cupidSwipesTable } from "../../lib/db/src/index";
import { eq, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

const router: IRouter = Router();
console.log("Profiles router initialized");

const upsertProfileSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(18).max(100),
  bio: z.string().min(1),
  gender: z.string(),
  interestedIn: z.array(z.string()).min(1),
  photoUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
});

router.get("/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const profile = await db.query.cupidProfilesTable.findFirst({
    where: eq(cupidProfilesTable.userId, req.user.id),
  });
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
});

router.put("/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = upsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const existing = await db.query.cupidProfilesTable.findFirst({
    where: eq(cupidProfilesTable.userId, req.user.id),
  });
  if (existing) {
    const [updated] = await db
      .update(cupidProfilesTable)
      .set({ ...data })
      .where(eq(cupidProfilesTable.userId, req.user.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(cupidProfilesTable)
      .values({ ...data, userId: req.user.id })
      .returning();
    res.json(created);
  }
});

router.get("/discover", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const myProfile = await db.query.cupidProfilesTable.findFirst({
    where: eq(cupidProfilesTable.userId, req.user.id),
  });
  if (!myProfile) {
    res.json([]);
    return;
  }

  const alreadySwiped = await db.query.cupidSwipesTable.findMany({
    where: eq(cupidSwipesTable.swiperId, req.user.id),
  });
  const swipedIds = alreadySwiped.map((s) => s.targetId);

  const excludeUserIds = [req.user.id, ...swipedIds];

  let candidates = await db.query.cupidProfilesTable.findMany({
    where: excludeUserIds.length > 0
      ? notInArray(cupidProfilesTable.userId, excludeUserIds)
      : ne(cupidProfilesTable.userId, req.user.id),
    limit: 20,
  });

  candidates = candidates.filter((c) =>
    myProfile.interestedIn.includes(c.gender) &&
    c.interestedIn.includes(myProfile.gender)
  );

  res.json(candidates);
});

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;

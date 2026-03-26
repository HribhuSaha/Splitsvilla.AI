import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const cupidSwipesTable = pgTable("cupid_swipes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  swiperId: text("swiper_id").notNull(),
  targetId: text("target_id").notNull(),
  direction: text("direction").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.swiperId, t.targetId)]);

export type CupidSwipe = typeof cupidSwipesTable.$inferSelect;

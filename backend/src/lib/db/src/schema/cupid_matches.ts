import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const cupidMatchesTable = pgTable("cupid_matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user1Id: text("user1_id").notNull(),
  user2Id: text("user2_id").notNull(),
  womenMustMessageFirst: boolean("women_must_message_first").notNull().default(false),
  womanId: text("woman_id"),
  messageDeadline: timestamp("message_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CupidMatch = typeof cupidMatchesTable.$inferSelect;

import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contestantsTable = pgTable("contestants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  hometown: text("hometown").notNull(),
  bio: text("bio").notNull(),
  zodiacSign: text("zodiac_sign").notNull(),
  personality: text("personality").notNull(),
  interests: text("interests").notNull(),
  status: text("status").notNull().default("active"),
  gender: text("gender").notNull(),
  currentSplitId: integer("current_split_id"),
  compatibilityScore: real("compatibility_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContestantSchema = createInsertSchema(contestantsTable).omit({ id: true, createdAt: true });
export type InsertContestant = z.infer<typeof insertContestantSchema>;
export type Contestant = typeof contestantsTable.$inferSelect;

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  voterContestantId: integer("voter_contestant_id").notNull(),
  nominatedContestantId: integer("nominated_contestant_id").notNull(),
  reason: text("reason"),
  round: integer("round").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, createdAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;

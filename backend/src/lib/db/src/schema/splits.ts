import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const splitsTable = pgTable("splits", {
  id: serial("id").primaryKey(),
  contestant1Id: integer("contestant1_id").notNull(),
  contestant2Id: integer("contestant2_id").notNull(),
  compatibilityScore: real("compatibility_score"),
  oraclePrediction: text("oracle_prediction"),
  status: text("status").notNull().default("active"),
  formedAt: timestamp("formed_at").notNull().defaultNow(),
});

export const insertSplitSchema = createInsertSchema(splitsTable).omit({ id: true, formedAt: true });
export type InsertSplit = z.infer<typeof insertSplitSchema>;
export type Split = typeof splitsTable.$inferSelect;

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cupidPublicKeysTable = pgTable("cupid_public_keys", {
  userId: text("user_id").primaryKey(),
  publicKey: text("public_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CupidPublicKey = typeof cupidPublicKeysTable.$inferSelect;

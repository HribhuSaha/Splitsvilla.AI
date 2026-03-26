import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cupidMessagesTable = pgTable("cupid_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content"),
  encryptedContent: text("encrypted_content"),
  iv: text("iv"),
  encryptedKeyForSender: text("encrypted_key_for_sender"),
  encryptedKeyForRecipient: text("encrypted_key_for_recipient"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CupidMessage = typeof cupidMessagesTable.$inferSelect;

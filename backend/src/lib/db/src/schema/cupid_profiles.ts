import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const cupidProfilesTable = pgTable("cupid_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  bio: text("bio").notNull(),
  gender: text("gender").notNull(),
  interestedIn: text("interested_in").array().notNull(),
  photoUrl: text("photo_url"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CupidProfile = typeof cupidProfilesTable.$inferSelect;

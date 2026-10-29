import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const memorySubmissions = sqliteTable("memory_submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  publicName: text("public_name").notNull(),
  anonymous: integer("anonymous").notNull().default(0),
  email: text("email").notNull(),
  phone: text("phone"),
  relationship: text("relationship").notNull(),
  title: text("title").notNull(),
  story: text("story").notNull(),
  photoKey: text("photo_key"),
  photoType: text("photo_type"),
  photoBytes: integer("photo_bytes").notNull().default(0),
  photoCaption: text("photo_caption"),
  photoDate: text("photo_date"),
  consentStory: integer("consent_story").notNull(),
  consentPhoto: integer("consent_photo").notNull().default(0),
  consentContact: integer("consent_contact").notNull().default(0),
  status: text("status").notNull().default("pending"),
  tokenHash: text("token_hash").notNull(),
  submissionKey: text("submission_key").notNull().unique(),
  note: text("note"),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const memoryEvents = sqliteTable("memory_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memoryId: text("memory_id").notNull(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  details: text("details"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const memoryRequests = sqliteTable("memory_requests", {
  id: text("id").primaryKey(),
  memoryId: text("memory_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const memoryRateLimits = sqliteTable("memory_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
});

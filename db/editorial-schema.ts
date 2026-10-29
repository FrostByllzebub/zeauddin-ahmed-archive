import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const editorialRequests = sqliteTable("editorial_requests", {
  id: text("id").primaryKey(),
  submissionKey: text("submission_key").notNull().unique(),
  category: text("category").notNull(),
  articleUrl: text("article_url").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  resolvedBy: text("resolved_by"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

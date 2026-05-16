import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  senderEmail: text("sender_email"),
  recipientHint: text("recipient_hint"),
  messageText: text("message_text"),
  imageData: text("image_data").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  accessGranted: boolean("access_granted").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  readDurationSeconds: real("read_duration_seconds"),
  deletedMessageAt: timestamp("deleted_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

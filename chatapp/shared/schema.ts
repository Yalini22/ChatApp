import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  status: text("status").default("offline"),
  lastSeen: timestamp("last_seen"),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId: integer("contact_id").notNull(),
  nickname: text("nickname"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, file
  imageUrl: text("image_url"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  isDelivered: boolean("is_delivered").default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastSeen: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
  isRead: true,
  isDelivered: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Extended types for UI
export type ContactWithUser = Contact & {
  user: User;
  lastMessage?: Message;
  unreadCount: number;
};

export type MessageWithSender = Message & {
  sender: User;
}; 


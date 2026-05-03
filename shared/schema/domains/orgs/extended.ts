import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, decimal, date, time } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const celebrationTemplates = pgTable("celebration_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id"),
  eventType: varchar("event_type").notNull(),
  templateText: text("template_text").notNull(),
  deliveryChannel: varchar("delivery_channel").default('dm'),
  requiresApproval: boolean("requires_approval").default(false),
  approvalRole: varchar("approval_role").default('supervisor'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertCelebrationTemplatesSchema = createInsertSchema(celebrationTemplates).omit({ id: true });
export type InsertCelebrationTemplates = z.infer<typeof insertCelebrationTemplatesSchema>;
export type CelebrationTemplates = typeof celebrationTemplates.$inferSelect;

export const milestoneTracker = pgTable("milestone_tracker", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  milestoneType: varchar("milestone_type").notNull(),
  milestoneDate: date("milestone_date").notNull(),
  triggeredAt: timestamp("triggered_at").default(sql`now()`),
  actionTaken: jsonb("action_taken"),
  celebrationMessageSent: boolean("celebration_message_sent").default(false),
  managerNotified: boolean("manager_notified").default(false),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertMilestoneTrackerSchema = createInsertSchema(milestoneTracker).omit({ id: true });
export type InsertMilestoneTracker = z.infer<typeof insertMilestoneTrackerSchema>;
export type MilestoneTracker = typeof milestoneTracker.$inferSelect;

export const orgCreationProgress = pgTable("org_creation_progress", {
  userId: varchar("user_id").notNull(),
  progressData: jsonb("progress_data").notNull().default('{}'),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
});
export const insertOrgCreationProgressSchema = createInsertSchema(orgCreationProgress).omit({ id: true });
export type InsertOrgCreationProgress = z.infer<typeof insertOrgCreationProgressSchema>;
export type OrgCreationProgress = typeof orgCreationProgress.$inferSelect;

import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USER MODEL
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("client"), // admin or client
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  phone: true,
  role: true,
});

// CLIENT MODEL
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  legalEntityName: text("legal_entity_name"),
  legalBusinessAddress: text("legal_business_address"),
  signeeName: text("signee_name"),
  signeeEmail: text("signee_email"),
  signeePhone: text("signee_phone"),
  onboardingStatus: text("onboarding_status").notNull().default("pending"), // pending, in_progress, completed
  pipelineStage: text("pipeline_stage").notNull().default("qualifying_call"), // qualifying_call, discovery_call, followup_call, free_work_delivery, final_presentation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// PROJECT MODEL
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goal: text("goal"),
  budget: text("budget"),
  timeline: text("timeline"),
  goLiveDate: timestamp("go_live_date"),
  status: text("status").notNull().default("planning"), // planning, in_progress, completed, on_hold
  progressPercentage: integer("progress_percentage").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// COMMUNICATION MODEL
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull().default("update"), // update, question, decision
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// DOCUMENT MODEL
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // contract, invoice, deliverable
  status: text("status").notNull().default("draft"), // draft, sent, signed, paid
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ONBOARDING DATA MODEL
export const onboardingData = pgTable("onboarding_data", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  phase: text("phase").notNull(), // basic_info, project_details, company_profile
  data: json("data").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOnboardingDataSchema = createInsertSchema(onboardingData).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// PROJECT STATUS MODELS
export const projectStatusTypes = pgTable("project_status_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., 'SCOPING', 'REVIEWING', etc.
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(), // For sorting
  category: text("category").notNull(), // 'INITIAL', 'EXECUTION', 'REVIEW', 'COMPLETION'
  clientVisible: boolean("client_visible").notNull().default(true),
  requiresClientAction: boolean("requires_client_action").notNull().default(false),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectStatusTypeSchema = createInsertSchema(projectStatusTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const projectStatusTransitions = pgTable("project_status_transitions", {
  id: serial("id").primaryKey(),
  fromStatus: text("from_status").notNull().references(() => projectStatusTypes.code),
  toStatus: text("to_status").notNull().references(() => projectStatusTypes.code),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectStatusTransitionSchema = createInsertSchema(projectStatusTransitions).omit({
  id: true,
  createdAt: true,
});

export const projectStatusHistory = pgTable("project_status_history", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  statusCode: text("status_code").notNull().references(() => projectStatusTypes.code),
  fromDate: timestamp("from_date").defaultNow().notNull(),
  toDate: timestamp("to_date"),
  duration: integer("duration"), // in seconds
  changedById: integer("changed_by_id").notNull().references(() => users.id),
  notes: text("notes"),
  subStatus: text("sub_status"), // e.g., 'CLARIFICATION_NEEDED', 'BLOCKED', null
  subStatusReason: text("sub_status_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectStatusHistorySchema = createInsertSchema(projectStatusHistory).omit({
  id: true,
  toDate: true,
  duration: true,
  createdAt: true,
});

export const projectClarifications = pgTable("project_clarifications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  question: text("question").notNull(),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  response: text("response"),
  respondedById: integer("responded_by_id").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectClarificationSchema = createInsertSchema(projectClarifications).omit({
  id: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Add new column to projects table for enhanced status tracking
export const projectStatusData = pgTable("project_status_data", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id).unique(),
  currentStatusCode: text("current_status_code").notNull().references(() => projectStatusTypes.code),
  currentStatusSince: timestamp("current_status_since").defaultNow().notNull(),
  currentSubStatus: text("current_sub_status"), // e.g., 'CLARIFICATION_NEEDED', 'BLOCKED', null
  subStatusReason: text("sub_status_reason"),
  subStatusSince: timestamp("sub_status_since"),
  estimatedTimeline: jsonb("estimated_timeline"), // Map of status codes to estimated dates
  healthStatus: text("health_status").notNull().default("GOOD"), // 'EXCELLENT', 'GOOD', 'AT_RISK', 'CRITICAL'
  healthFactors: jsonb("health_factors"), // Object with timeline, budget, scopeClarity, communication statuses
  healthLastUpdated: timestamp("health_last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectStatusDataSchema = createInsertSchema(projectStatusData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OnboardingData = typeof onboardingData.$inferSelect;
export type InsertOnboardingData = z.infer<typeof insertOnboardingDataSchema>;

export type ProjectStatusType = typeof projectStatusTypes.$inferSelect;
export type InsertProjectStatusType = z.infer<typeof insertProjectStatusTypeSchema>;

export type ProjectStatusTransition = typeof projectStatusTransitions.$inferSelect;
export type InsertProjectStatusTransition = z.infer<typeof insertProjectStatusTransitionSchema>;

export type ProjectStatusHistory = typeof projectStatusHistory.$inferSelect;
export type InsertProjectStatusHistory = z.infer<typeof insertProjectStatusHistorySchema>;

export type ProjectClarification = typeof projectClarifications.$inferSelect;
export type InsertProjectClarification = z.infer<typeof insertProjectClarificationSchema>;

export type ProjectStatusData = typeof projectStatusData.$inferSelect;
export type InsertProjectStatusData = z.infer<typeof insertProjectStatusDataSchema>;

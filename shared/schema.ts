import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

export type OnboardingData = typeof onboardingData.$inferSelect;
export type InsertOnboardingData = z.infer<typeof insertOnboardingDataSchema>;

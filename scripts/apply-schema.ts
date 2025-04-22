import { pool } from "../server/db";
import * as schema from "../shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

(async () => {
  console.log("Applying database schema...");
  
  try {
    // Create a db instance
    const db = drizzle(pool, { schema });
    
    // Execute the schema creation directly using SQL for each table
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT,
        "username" TEXT NOT NULL UNIQUE,
        "email" TEXT UNIQUE,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'client',
        "phone" TEXT,
        "title" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id"),
        "companyName" TEXT NOT NULL,
        "industry" TEXT,
        "size" TEXT,
        "website" TEXT,
        "logo" TEXT,
        "address" TEXT,
        "pipelineStage" TEXT NOT NULL DEFAULT 'lead',
        "source" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "clientId" INTEGER NOT NULL REFERENCES "clients"("id"),
        "description" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'planning',
        "goal" TEXT,
        "budget" TEXT,
        "timeline" TEXT,
        "goLiveDate" TIMESTAMP WITH TIME ZONE,
        "progressPercentage" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Communications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "communications" (
        "id" SERIAL PRIMARY KEY,
        "projectId" INTEGER NOT NULL REFERENCES "projects"("id"),
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'note',
        "senderId" INTEGER NOT NULL REFERENCES "users"("id"),
        "recipientId" INTEGER NOT NULL REFERENCES "users"("id"),
        "readAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "clientId" INTEGER REFERENCES "clients"("id"),
        "projectId" INTEGER REFERENCES "projects"("id"),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Onboarding data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "onboarding_data" (
        "id" SERIAL PRIMARY KEY,
        "clientId" INTEGER NOT NULL REFERENCES "clients"("id"),
        "phase" TEXT NOT NULL,
        "data" JSONB NOT NULL,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "dueDate" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Project Status Types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "project_status_types" (
        "id" SERIAL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "clientVisible" BOOLEAN NOT NULL DEFAULT true,
        "requiresClientAction" BOOLEAN NOT NULL DEFAULT false,
        "color" TEXT,
        "icon" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Project Status Transitions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "project_status_transitions" (
        "id" SERIAL PRIMARY KEY,
        "fromStatus" TEXT NOT NULL,
        "toStatus" TEXT NOT NULL,
        "requiresApproval" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("fromStatus", "toStatus")
      );
    `);
    
    // Project Status History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "project_status_history" (
        "id" SERIAL PRIMARY KEY,
        "projectId" INTEGER NOT NULL REFERENCES "projects"("id"),
        "statusCode" TEXT NOT NULL,
        "fromDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "toDate" TIMESTAMP WITH TIME ZONE,
        "duration" INTEGER,
        "changedById" INTEGER NOT NULL REFERENCES "users"("id"),
        "notes" TEXT,
        "subStatus" TEXT,
        "subStatusReason" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Project Clarifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "project_clarifications" (
        "id" SERIAL PRIMARY KEY,
        "projectId" INTEGER NOT NULL REFERENCES "projects"("id"),
        "question" TEXT NOT NULL,
        "response" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "requestedById" INTEGER NOT NULL REFERENCES "users"("id"),
        "respondedById" INTEGER REFERENCES "users"("id"),
        "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "respondedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Project Status Data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "project_status_data" (
        "id" SERIAL PRIMARY KEY,
        "projectId" INTEGER NOT NULL REFERENCES "projects"("id") UNIQUE,
        "currentStatus" TEXT NOT NULL,
        "currentSubStatus" TEXT,
        "healthStatus" TEXT NOT NULL DEFAULT 'good',
        "healthFactors" JSONB,
        "lastUpdatedById" INTEGER NOT NULL REFERENCES "users"("id"),
        "lastUpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Database schema applied successfully!");
  } catch (error) {
    console.error("Error applying schema:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
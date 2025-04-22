import { db } from "../db";
import { projectStatusTypes, projectStatusTransitions, InsertProjectStatusType, InsertProjectStatusTransition } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed default project status types and transitions
 */
export async function seedProjectStatusTypes(): Promise<void> {
  // Check if we already have status types
  const existingStatusTypes = await db.select().from(projectStatusTypes);
  if (existingStatusTypes.length > 0) {
    console.log("Project status types already exist, skipping seed");
    return;
  }

  console.log("Seeding project status types and transitions...");

  // Define status types with their details
  const statusTypes = [
    {
      "code": "SCOPING",
      "name": "Scoping",
      "description": "Defining the project scope and requirements",
      "order": 10,
      "category": "INITIAL",
      "clientVisible": true,
      "requiresClientAction": false,
      "color": "#3498db", // Blue
      "icon": "scroll"
    },
    {
      code: "REVIEWING",
      name: "Reviewing",
      description: "Reviewing project requirements and feasibility",
      order: 20,
      category: "INITIAL",
      clientVisible: true,
      requiresClientAction: false,
      color: "#9b59b6", // Purple
      icon: "search"
    },
    {
      code: "PROPOSAL_PHASE",
      name: "Proposal Phase",
      description: "Creating and finalizing the project proposal",
      order: 30,
      category: "INITIAL",
      clientVisible: true,
      requiresClientAction: false,
      color: "#e74c3c", // Red
      icon: "file-text"
    },
    {
      code: "APPROVED",
      name: "Approved",
      description: "Project proposal has been approved",
      order: 40,
      category: "INITIAL",
      clientVisible: true,
      requiresClientAction: true,
      color: "#2ecc71", // Green
      icon: "check-circle"
    },
    {
      code: "SETTING_UP",
      name: "Setting Up",
      description: "Setting up the project infrastructure and environment",
      order: 50,
      category: "EXECUTION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#f39c12", // Orange
      icon: "tool"
    },
    {
      code: "PROJECT_IN_PROGRESS",
      name: "In Progress",
      description: "Work is actively being done on the project",
      order: 60,
      category: "EXECUTION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#27ae60", // Darker Green
      icon: "activity"
    },
    {
      code: "ON_HOLD",
      name: "On Hold",
      description: "Project is temporarily paused",
      order: 70,
      category: "EXECUTION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#95a5a6", // Gray
      icon: "pause-circle"
    },
    {
      code: "REVISION_REQUIRED",
      name: "Revision Required",
      description: "Changes are needed based on feedback",
      order: 80,
      category: "REVIEW",
      clientVisible: true,
      requiresClientAction: false,
      color: "#e67e22", // Darker Orange
      icon: "repeat"
    },
    {
      code: "INTERNAL_REVIEW",
      name: "Internal Review",
      description: "Project is being reviewed internally",
      order: 90,
      category: "REVIEW",
      clientVisible: true,
      requiresClientAction: false,
      color: "#34495e", // Dark Blue
      icon: "check-square"
    },
    {
      code: "READY_FOR_CLIENT_REVIEW",
      name: "Ready for Client Review",
      description: "Project is ready for client review",
      order: 100,
      category: "REVIEW",
      clientVisible: true,
      requiresClientAction: true,
      color: "#16a085", // Teal
      icon: "eye"
    },
    {
      code: "UAT_TESTING",
      name: "UAT Testing",
      description: "User acceptance testing in progress",
      order: 110,
      category: "REVIEW",
      clientVisible: true,
      requiresClientAction: true,
      color: "#d35400", // Brown
      icon: "zap"
    },
    {
      code: "DEPLOYMENT_PREPARATION",
      name: "Deployment Prep",
      description: "Preparing for final deployment",
      order: 120,
      category: "COMPLETION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#8e44ad", // Darker Purple
      icon: "package"
    },
    {
      code: "DEPLOYED",
      name: "Deployed",
      description: "Project has been deployed",
      order: 130,
      category: "COMPLETION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#2980b9", // Darker Blue
      icon: "send"
    },
    {
      code: "COMPLETED",
      name: "Completed",
      description: "Project is complete",
      order: 140,
      category: "COMPLETION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#27ae60", // Green
      icon: "check"
    },
    {
      code: "MAINTENANCE",
      name: "Maintenance",
      description: "Project is in maintenance mode",
      order: 150,
      category: "COMPLETION",
      clientVisible: true,
      requiresClientAction: false,
      color: "#7f8c8d", // Light Gray
      icon: "tool"
    }
  ];

  // Insert status types
  await db.insert(projectStatusTypes).values(statusTypes);

  // Define allowed transitions between statuses
  const transitions: InsertProjectStatusTransition[] = [
    // Initial phase transitions
    { fromStatus: "SCOPING", toStatus: "REVIEWING" },
    { fromStatus: "REVIEWING", toStatus: "PROPOSAL_PHASE" },
    { fromStatus: "REVIEWING", toStatus: "SCOPING" },
    { fromStatus: "PROPOSAL_PHASE", toStatus: "APPROVED" },
    { fromStatus: "PROPOSAL_PHASE", toStatus: "REVIEWING" },
    { fromStatus: "APPROVED", toStatus: "SETTING_UP" },
    
    // Execution phase transitions
    { fromStatus: "SETTING_UP", toStatus: "PROJECT_IN_PROGRESS" },
    { fromStatus: "PROJECT_IN_PROGRESS", toStatus: "ON_HOLD" },
    { fromStatus: "PROJECT_IN_PROGRESS", toStatus: "INTERNAL_REVIEW" },
    { fromStatus: "ON_HOLD", toStatus: "PROJECT_IN_PROGRESS" },
    
    // Review phase transitions
    { fromStatus: "INTERNAL_REVIEW", toStatus: "REVISION_REQUIRED" },
    { fromStatus: "INTERNAL_REVIEW", toStatus: "READY_FOR_CLIENT_REVIEW" },
    { fromStatus: "READY_FOR_CLIENT_REVIEW", toStatus: "REVISION_REQUIRED" },
    { fromStatus: "READY_FOR_CLIENT_REVIEW", toStatus: "UAT_TESTING" },
    { fromStatus: "REVISION_REQUIRED", toStatus: "PROJECT_IN_PROGRESS" },
    { fromStatus: "UAT_TESTING", toStatus: "REVISION_REQUIRED" },
    { fromStatus: "UAT_TESTING", toStatus: "DEPLOYMENT_PREPARATION" },
    
    // Completion phase transitions
    { fromStatus: "DEPLOYMENT_PREPARATION", toStatus: "DEPLOYED" },
    { fromStatus: "DEPLOYED", toStatus: "COMPLETED" },
    { fromStatus: "COMPLETED", toStatus: "MAINTENANCE" },
    { fromStatus: "MAINTENANCE", toStatus: "PROJECT_IN_PROGRESS" }
  ];

  // Insert transitions
  await db.insert(projectStatusTransitions).values(transitions);

  console.log("Project status types and transitions seeded successfully");
}

/**
 * Map legacy status to new status code
 */
export function mapLegacyStatusToNewStatus(legacyStatus: string): string {
  const statusMap: Record<string, string> = {
    'planning': 'SCOPING',
    'in_progress': 'PROJECT_IN_PROGRESS',
    'on_hold': 'ON_HOLD',
    'completed': 'COMPLETED'
  };

  return statusMap[legacyStatus] || 'SCOPING';
}
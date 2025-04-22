import { db } from "../db";
import { 
  projectStatusTypes, 
  projectStatusTransitions, 
  projectStatusHistory, 
  projectClarifications,
  projectStatusData,
  projects,
  users,
  ProjectStatusType,
  ProjectStatusHistory,
  ProjectClarification,
  ProjectStatusData
} from "@shared/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

/**
 * Service for managing project status and transitions
 */
export class ProjectStatusService {
  /**
   * Get valid next statuses for a project based on current status
   */
  async getValidNextStatuses(projectId: number): Promise<ProjectStatusType[]> {
    // Get the current project status
    const [projectData] = await db
      .select()
      .from(projectStatusData)
      .where(eq(projectStatusData.projectId, projectId));

    if (!projectData) {
      throw new Error("Project status data not found");
    }

    // Get all valid transitions from current status
    const transitions = await db
      .select()
      .from(projectStatusTransitions)
      .where(eq(projectStatusTransitions.fromStatus, projectData.currentStatus));

    // Get status details for each valid next status
    const nextStatusCodes = transitions.map(t => t.toStatus);
    
    let nextStatuses: ProjectStatusType[] = [];
    if (nextStatusCodes.length > 0) {
      // If we have next status codes, query them
      for (const code of nextStatusCodes) {
        const statuses = await db
          .select()
          .from(projectStatusTypes)
          .where(eq(projectStatusTypes.code, code));
        nextStatuses = [...nextStatuses, ...statuses];
      }
    }

    return nextStatuses;
  }

  /**
   * Update a project's status
   */
  async updateProjectStatus(
    projectId: number,
    newStatusCode: string,
    userId: number,
    notes?: string
  ): Promise<{ project: any, statusHistory: ProjectStatusHistory }> {
    // Validate the status transition
    const validNextStatuses = await this.getValidNextStatuses(projectId);
    if (!validNextStatuses.some(s => s.code === newStatusCode)) {
      throw new Error(`Invalid status transition to ${newStatusCode}`);
    }

    // Get current project status data
    const [projectStatusInfo] = await db
      .select()
      .from(projectStatusData)
      .where(eq(projectStatusData.projectId, projectId));

    const oldStatusCode = projectStatusInfo.currentStatus;
    const now = new Date();

    // Start a transaction for updating all related records
    await db.transaction(async (tx) => {
      // 1. Close the current status in history
      const [currentHistoryEntry] = await tx
        .select()
        .from(projectStatusHistory)
        .where(
          and(
            eq(projectStatusHistory.projectId, projectId),
            eq(projectStatusHistory.statusCode, oldStatusCode),
            isNull(projectStatusHistory.toDate)
          )
        )
        .orderBy(desc(projectStatusHistory.fromDate))
        .limit(1);

      if (currentHistoryEntry) {
        const duration = Math.floor((now.getTime() - currentHistoryEntry.fromDate.getTime()) / 1000);
        await tx
          .update(projectStatusHistory)
          .set({
            toDate: now,
            duration: duration
          })
          .where(eq(projectStatusHistory.id, currentHistoryEntry.id));
      }

      // 2. Create a new status history entry
      const [newHistoryEntry] = await tx
        .insert(projectStatusHistory)
        .values({
          projectId,
          statusCode: newStatusCode,
          fromDate: now,
          changedById: userId,
          notes: notes || "",
          subStatus: null,
          subStatusReason: null
        })
        .returning();

      // 3. Update project status data
      await tx
        .update(projectStatusData)
        .set({
          currentStatus: newStatusCode,
          currentSubStatus: null,
          lastUpdatedAt: now
        })
        .where(eq(projectStatusData.projectId, projectId));

      // 4. Update original project status field for backward compatibility
      await tx
        .update(projects)
        .set({
          status: this.mapNewStatusToLegacyStatus(newStatusCode),
          updatedAt: now
        })
        .where(eq(projects.id, projectId));
    });

    // Get updated project and history entry
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    const [statusHistory] = await db
      .select()
      .from(projectStatusHistory)
      .where(
        and(
          eq(projectStatusHistory.projectId, projectId),
          eq(projectStatusHistory.statusCode, newStatusCode),
          isNull(projectStatusHistory.toDate)
        )
      )
      .orderBy(desc(projectStatusHistory.fromDate))
      .limit(1);

    return { project, statusHistory };
  }

  /**
   * Set a project's sub-status
   */
  async setProjectSubStatus(
    projectId: number,
    subStatus: string,
    userId: number,
    reason?: string
  ): Promise<{ success: boolean, message: string }> {
    // Get current project status data
    const [projectStatusInfo] = await db
      .select()
      .from(projectStatusData)
      .where(eq(projectStatusData.projectId, projectId));

    if (!projectStatusInfo) {
      throw new Error("Project status data not found");
    }

    const now = new Date();

    // Update the project status data with the new sub-status
    await db
      .update(projectStatusData)
      .set({
        currentSubStatus: subStatus,
        lastUpdatedById: userId,
        lastUpdatedAt: now
      })
      .where(eq(projectStatusData.projectId, projectId));

    // Update current status history entry with sub-status
    const [currentHistoryEntry] = await db
      .select()
      .from(projectStatusHistory)
      .where(
        and(
          eq(projectStatusHistory.projectId, projectId),
          eq(projectStatusHistory.statusCode, projectStatusInfo.currentStatus),
          isNull(projectStatusHistory.toDate)
        )
      )
      .orderBy(desc(projectStatusHistory.fromDate))
      .limit(1);

    if (currentHistoryEntry) {
      await db
        .update(projectStatusHistory)
        .set({
          subStatus,
          subStatusReason: reason || null
        })
        .where(eq(projectStatusHistory.id, currentHistoryEntry.id));
    }

    return { 
      success: true, 
      message: `Sub-status updated to ${subStatus}${reason ? ` with reason: ${reason}` : ''}` 
    };
  }

  /**
   * Request clarification for a project
   */
  async requestClarification(
    projectId: number,
    question: string,
    userId: number
  ): Promise<{ clarification: ProjectClarification }> {
    const now = new Date();

    // Create the clarification request
    const [clarification] = await db
      .insert(projectClarifications)
      .values({
        projectId,
        question,
        requestedById: userId,
        requestedAt: now
      })
      .returning();

    // Set project sub-status to clarification needed
    await this.setProjectSubStatus(
      projectId,
      'CLARIFICATION_NEEDED',
      userId,
      `Clarification requested: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`
    );

    return { clarification };
  }

  /**
   * Respond to a clarification request
   */
  async respondToClarification(
    clarificationId: number,
    response: string,
    userId: number
  ): Promise<{ clarification: ProjectClarification }> {
    const now = new Date();

    // Update the clarification with the response
    const [clarification] = await db
      .update(projectClarifications)
      .set({
        response,
        respondedById: userId,
        respondedAt: now,
        status: "RESOLVED" 
      })
      .where(eq(projectClarifications.id, clarificationId))
      .returning();

    // Get the project ID from the clarification
    const projectId = clarification.projectId;

    // Get current project status data
    const [projectStatusInfo] = await db
      .select()
      .from(projectStatusData)
      .where(eq(projectStatusData.projectId, projectId));

    // If the current sub-status is CLARIFICATION_NEEDED, clear it
    if (projectStatusInfo?.currentSubStatus === 'CLARIFICATION_NEEDED') {
      await this.setProjectSubStatus(
        projectId,
        'NONE',
        userId,
        `Clarification resolved: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`
      );
    }

    return { clarification };
  }

  /**
   * Update project health status
   */
  async updateProjectHealth(
    projectId: number,
    healthStatus: string,
    healthFactors: Record<string, string>,
    userId: number
  ): Promise<{ success: boolean, message: string }> {
    const now = new Date();

    // Validate health status value
    const validHealthStatuses = ['EXCELLENT', 'GOOD', 'AT_RISK', 'CRITICAL'];
    if (!validHealthStatuses.includes(healthStatus)) {
      throw new Error(`Invalid health status: ${healthStatus}. Must be one of: ${validHealthStatuses.join(', ')}`);
    }

    // Update the project status data with health information
    await db
      .update(projectStatusData)
      .set({
        healthStatus,
        healthFactors,
        lastUpdatedById: userId,
        lastUpdatedAt: now
      })
      .where(eq(projectStatusData.projectId, projectId));

    return { 
      success: true, 
      message: `Project health updated to ${healthStatus}` 
    };
  }

  /**
   * Get project status history
   */
  async getProjectStatusHistory(projectId: number): Promise<Array<ProjectStatusHistory & { changedBy: { id: number, name: string } }>> {
    const history = await db
      .select({
        history: projectStatusHistory,
        user: {
          id: users.id,
          name: users.name
        }
      })
      .from(projectStatusHistory)
      .leftJoin(users, eq(projectStatusHistory.changedById, users.id))
      .where(eq(projectStatusHistory.projectId, projectId))
      .orderBy(desc(projectStatusHistory.fromDate));

    return history.map(item => ({
      ...item.history,
      changedBy: item.user
    }));
  }

  /**
   * Get project clarifications
   */
  async getProjectClarifications(projectId: number): Promise<ProjectClarification[]> {
    const clarifications = await db
      .select()
      .from(projectClarifications)
      .where(eq(projectClarifications.projectId, projectId))
      .orderBy(desc(projectClarifications.requestedAt));

    return clarifications;
  }

  /**
   * Get detailed project status data
   */
  async getProjectStatusData(projectId: number): Promise<{
    statusData: ProjectStatusData,
    currentStatus: ProjectStatusType,
    validNextStatuses: ProjectStatusType[]
  }> {
    // Get project status data
    const [statusData] = await db
      .select()
      .from(projectStatusData)
      .where(eq(projectStatusData.projectId, projectId));

    if (!statusData) {
      throw new Error("Project status data not found");
    }

    // Get current status details
    const [currentStatus] = await db
      .select()
      .from(projectStatusTypes)
      .where(eq(projectStatusTypes.code, statusData.currentStatus));

    // Get valid next statuses
    const validNextStatuses = await this.getValidNextStatuses(projectId);

    return {
      statusData,
      currentStatus,
      validNextStatuses
    };
  }

  /**
   * Initialize project status for a new project
   */
  async initializeProjectStatus(
    projectId: number,
    statusCode: string = 'SCOPING',
    userId: number
  ): Promise<{ success: boolean, message: string }> {
    const now = new Date();

    // Check if the status code is valid
    const [statusType] = await db
      .select()
      .from(projectStatusTypes)
      .where(eq(projectStatusTypes.code, statusCode));

    if (!statusType) {
      throw new Error(`Invalid status code: ${statusCode}`);
    }

    // Create initial status data entry
    await db
      .insert(projectStatusData)
      .values({
        projectId,
        currentStatus: statusCode,
        healthStatus: 'GOOD',
        healthFactors: {
          timeline: 'GOOD',
          budget: 'GOOD',
          scopeClarity: 'GOOD',
          communication: 'GOOD'
        },
        lastUpdatedById: userId,
        lastUpdatedAt: now
      });

    // Create initial status history entry
    await db
      .insert(projectStatusHistory)
      .values({
        projectId,
        statusCode,
        fromDate: now,
        changedById: userId,
        notes: "Project created"
      });

    return { 
      success: true, 
      message: `Project status initialized to ${statusCode}` 
    };
  }

  /**
   * Map new status code to legacy status for backward compatibility
   */
  private mapNewStatusToLegacyStatus(statusCode: string): string {
    const statusMap: Record<string, string> = {
      'SCOPING': 'planning',
      'REVIEWING': 'planning',
      'PROPOSAL_PHASE': 'planning',
      'APPROVED': 'planning',
      'SETTING_UP': 'planning',
      'PROJECT_IN_PROGRESS': 'in_progress',
      'ON_HOLD': 'on_hold',
      'REVISION_REQUIRED': 'in_progress',
      'INTERNAL_REVIEW': 'in_progress',
      'READY_FOR_CLIENT_REVIEW': 'in_progress',
      'UAT_TESTING': 'in_progress',
      'DEPLOYMENT_PREPARATION': 'in_progress',
      'DEPLOYED': 'in_progress',
      'COMPLETED': 'completed',
      'MAINTENANCE': 'completed'
    };

    return statusMap[statusCode] || 'planning';
  }
}

export const projectStatusService = new ProjectStatusService();
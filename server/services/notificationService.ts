import { db } from "../db";
import { users, communications, clients } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Service for handling internal notifications and communications
 */
export class NotificationService {
  /**
   * Send notifications to relevant users about a project status change
   */
  async sendStatusChangeNotifications(
    project: any, 
    oldStatus: string, 
    newStatus: string, 
    notes?: string
  ): Promise<{ success: boolean, message: string }> {
    try {
      // Get client and user information in separate queries
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, project.clientId))
        .then(results => results[0]);

      // If client exists, get the associated user
      let clientUser = null;
      if (client) {
        clientUser = await db
          .select()
          .from(users)
          .where(eq(users.id, client.userId))
          .then(results => results[0]);
      }

      // Get admin users to notify
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));

      // Create communication records for the status change
      // For simplicity, we'll create a single communication record for the client
      if (clientUser) {
        await this.createStatusChangeCommunication(
          project.id,
          adminUsers[0]?.id || 1, // Default to first admin or ID 1
          clientUser.id,
          `Project "${project.name}" status has been updated from ${oldStatus} to ${newStatus}${notes ? `. Notes: ${notes}` : ''}`
        );
      }

      return {
        success: true,
        message: `Notifications sent for project ${project.id} status change`
      };
    } catch (error) {
      console.error("Error sending status change notifications:", error);
      return {
        success: false,
        message: `Failed to send notifications for project ${project.id}`
      };
    }
  }

  /**
   * Send a notification about a clarification request
   */
  async sendClarificationRequest(
    project: any,
    reason: string
  ): Promise<{ success: boolean, message: string }> {
    try {
      // Get client and user information in separate queries
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, project.clientId))
        .then(results => results[0]);

      // If client exists, get the associated user
      let clientUser = null;
      if (client) {
        clientUser = await db
          .select()
          .from(users)
          .where(eq(users.id, client.userId))
          .then(results => results[0]);
      }

      // Get admin users to notify
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));

      // Create communication to the client requesting clarification
      if (clientUser) {
        await this.createStatusChangeCommunication(
          project.id,
          adminUsers[0]?.id || 1, // Default to first admin or ID 1
          clientUser.id,
          `We need your input on project "${project.name}". ${reason}`
        );
      }

      return {
        success: true,
        message: `Clarification request notification sent for project ${project.id}`
      };
    } catch (error) {
      console.error("Error sending clarification request:", error);
      return {
        success: false,
        message: `Failed to send clarification request for project ${project.id}`
      };
    }
  }

  /**
   * Create a communication entry for a status change
   */
  private async createStatusChangeCommunication(
    projectId: number,
    senderId: number,
    recipientId: number,
    message: string
  ): Promise<void> {
    await db
      .insert(communications)
      .values({
        projectId,
        senderId,
        recipientId,
        message,
        type: "update"
      });
  }
}

export const notificationService = new NotificationService();
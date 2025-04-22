import crypto from 'crypto';

/**
 * Service for handling webhook notifications
 */
export class WebhookService {
  /**
   * Send notifications about project status changes to external systems
   */
  async notifyExternalSystems(project: any, statusChange: any): Promise<{ success: boolean, message: string }> {
    // This is a stub implementation for the webhook service
    // In a real implementation, this would fetch registered webhooks from the database
    // and send HTTP requests to the registered webhook URLs

    // For now, we'll just log the status change
    console.log(`Project ${project.id} status changed from ${statusChange.fromStatus} to ${statusChange.toStatus}`);
    
    return {
      success: true,
      message: `Webhook notification would be sent for project ${project.id} status change`
    };
  }

  /**
   * Generate a signature for webhook payloads
   */
  generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}

export const webhookService = new WebhookService();
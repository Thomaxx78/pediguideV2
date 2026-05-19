import crypto from 'crypto';

interface DiditConfig {
  appId: string;
  workflowId: string;
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  authUrl: string;
}

interface CreateSessionResponse {
  session_id: string;
  url: string; // V2 returns 'url'
  redirect_url?: string; // Kept for backward compat
  status: string;
}

export class DiditService {
  private config: DiditConfig;

  constructor() {
    this.config = {
      appId: process.env.DIDIT_APP_ID || '',
      workflowId: process.env.DIDIT_WORKFLOW_ID || '',
      apiKey: process.env.DIDIT_API_KEY || '',
      webhookSecret: process.env.DIDIT_WEBHOOK_SECRET || '',
      baseUrl: process.env.DIDIT_BASE_URL || 'https://verification.didit.me',
      authUrl: process.env.DIDIT_AUTH_URL || 'https://apx.didit.me',
    };

    // Validate required config
    if (!this.config.appId || !this.config.apiKey || !this.config.webhookSecret) {
      throw new Error('Missing required Didit configuration. Please check your environment variables.');
    }
  }

  /**
   * Create a verification session for a user
   * @param doctorId - The ID of the doctor to verify
   * @param callbackUrl - The URL to redirect to after verification
   * @returns Session information including redirect URL
   */
  async createVerificationSession(
    doctorId: string,
    callbackUrl?: string
  ): Promise<CreateSessionResponse> {
    try {
      const url = `${this.config.baseUrl}/v2/session/`;

      const payload = {
        workflow_id: this.config.workflowId,
        callback: callbackUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`,
        vendor_data: doctorId,
      };

      console.log('🚀 [Didit] Creating session...', {
        url,
        workflow_id: payload.workflow_id,
        vendor_data: payload.vendor_data
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Didit API error (${response.status}): ${errorData}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Didit verification session:', error);
      throw error;
    }
  }

  /**
   * Verify the webhook signature from Didit
   * @param signature - The signature from the webhook header
   * @param payload - The raw webhook payload
   * @returns True if signature is valid
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const diditService = new DiditService();

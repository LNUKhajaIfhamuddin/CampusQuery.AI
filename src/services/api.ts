import {
  ConversationSummary,
  Conversation,
  KnowledgeDocumentSummary,
  KnowledgeDocumentDetail,
  AnalyticsStats,
  SystemStatus,
  UserRole,
} from '../types';

export class CampusApi {
  private static getHeaders(role: UserRole = 'student'): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-role': role,
    };
  }

  // System status
  static async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  }

  // Conversations
  static async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch('/api/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  }

  static async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  }

  static async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  }

  static async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  }

  static async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{
    conversationId: string;
    userMessage: any;
    assistantMessage: any;
    metadata: {
      category: string;
      isFallback: boolean;
      responseTimeMs: number;
    };
  }> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  }

  static async sendFeedback(
    conversationId: string,
    messageId: string,
    feedback: 'helpful' | 'unhelpful'
  ): Promise<void> {
    const res = await fetch(`/api/conversations/${conversationId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messageId, feedback }),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
  }

  // Documents (Admin)
  static async getDocuments(): Promise<KnowledgeDocumentSummary[]> {
    const res = await fetch('/api/documents');
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  }

  static async getDocumentDetail(id: string): Promise<KnowledgeDocumentDetail> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document detail');
    return res.json();
  }

  static async uploadDocument(
    payload: {
      title: string;
      category: string;
      filename?: string;
      content?: string;
      base64Data?: string;
      mimeType?: string;
    },
    role: UserRole
  ): Promise<any> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getHeaders(role),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to upload document');
    }
    return res.json();
  }

  static async toggleDocument(id: string, role: UserRole): Promise<any> {
    const res = await fetch(`/api/documents/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to toggle document');
    }
    return res.json();
  }

  static async deleteDocument(id: string, role: UserRole): Promise<void> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to delete document');
    }
  }

  static async resetDemoDocuments(role: UserRole): Promise<any> {
    const res = await fetch('/api/documents/reset-demo', {
      method: 'POST',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to reset demo documents');
    }
    return res.json();
  }

  // Analytics (Admin)
  static async getAnalytics(role: UserRole): Promise<AnalyticsStats> {
    const res = await fetch('/api/admin/analytics', {
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to load analytics');
    }
    return res.json();
  }

  static async resolveUnansweredQuery(id: string, role: UserRole): Promise<void> {
    const res = await fetch(`/api/admin/unanswered/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to resolve query');
    }
  }
}

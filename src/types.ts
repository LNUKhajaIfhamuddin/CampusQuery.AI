export type UserRole = 'student' | 'admin';

export interface Citation {
  docId: string;
  docTitle: string;
  sectionTitle: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
  feedback?: 'helpful' | 'unhelpful';
  isFallback?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[];
}

export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  sectionTitle: string;
  text: string;
  charCount: number;
}

export interface KnowledgeDocumentSummary {
  id: string;
  title: string;
  category: 'Academic' | 'Financial Aid' | 'Housing & Dining' | 'Health & Wellness' | 'Campus Transit' | 'General';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  active: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentSummary {
  content: string;
  chunks: Chunk[];
}

export interface QueryLog {
  id: string;
  conversationId: string;
  query: string;
  answered: boolean;
  unansweredReason?: string;
  category: string;
  timestamp: string;
  responseTimeMs: number;
  citationsCount: number;
  resolved?: boolean;
}

export interface AnalyticsStats {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQueriesCount: number;
  answeredRatePercent: number;
  avgResponseTimeMs: number;
  totalDocuments: number;
  activeDocuments: number;
  totalKnowledgeChunks: number;
  totalConversations: number;
  categoryCounts: Record<string, number>;
  unansweredList: QueryLog[];
}

export interface SystemStatus {
  status: string;
  appName: string;
  version: string;
  geminiConfigured: boolean;
  model: string;
  storageMode: string;
  storageNotice: string;
}

import { Router, Request, Response, NextFunction } from 'express';
import { store, KnowledgeDocument } from './data/store';
import { askCampusQuery } from './rag';
import { extractTextFromBuffer } from './pdfHelper';

export const apiRouter = Router();

// Middleware: Check admin role for admin endpoints
function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'] || req.query.role;
  if (role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'This operation requires administrative privileges. Please switch to the Administrator role.',
    });
  }
  next();
}

// -------------------------------------------------------------
// System Info & Health
// -------------------------------------------------------------
apiRouter.get('/system/status', (_req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    status: 'online',
    appName: 'CampusQuery AI',
    version: '1.0.0',
    geminiConfigured: hasGeminiKey,
    model: 'gemini-3.8-flash',
    storageMode: 'Disk-Cached / Memory Store (Preview Mode)',
    storageNotice:
      'Running in preview environment. Uploaded documents and conversation history are persisted to local storage. Production deployments connect to enterprise Cloud SQL / Firestore databases with institutional single sign-on (SSO).',
  });
});

// -------------------------------------------------------------
// Conversation Endpoints (Student & Admin)
// -------------------------------------------------------------

// List conversations
apiRouter.get('/conversations', (_req: Request, res: Response) => {
  try {
    const list = store.getConversations();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversations', details: err.message });
  }
});

// Create new conversation
apiRouter.post('/conversations', (req: Request, res: Response) => {
  try {
    const title = req.body?.title || 'New Student Inquiry';
    const conv = store.createConversation(title);
    res.status(201).json(conv);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation', details: err.message });
  }
});

// Get single conversation
apiRouter.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const conv = store.getConversationById(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load conversation', details: err.message });
  }
});

// Delete conversation
apiRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  try {
    const deleted = store.deleteConversation(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation', details: err.message });
  }
});

// Send message & trigger RAG pipeline
apiRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required and cannot be empty.' });
  }

  const trimmedQuery = content.trim();

  // Validate conversation exists or auto-create
  let conv = store.getConversationById(id);
  if (!conv) {
    conv = store.createConversation(trimmedQuery.slice(0, 40));
  }

  // 1. Record user message
  const userMsg = store.addMessage(conv.id, {
    role: 'user',
    content: trimmedQuery,
  });

  // 2. Build history for RAG context
  const history = conv.messages.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    // 3. Server-side RAG workflow with Gemini 3.8 Flash
    const ragResult = await askCampusQuery(trimmedQuery, history);

    // 4. Save assistant response with citations
    const assistantMsg = store.addMessage(conv.id, {
      role: 'assistant',
      content: ragResult.answer,
      citations: ragResult.citations,
      isFallback: ragResult.isFallback,
    });

    // 5. Log query event for admin analytics
    store.logQuery({
      conversationId: conv.id,
      query: trimmedQuery,
      answered: !ragResult.isFallback,
      unansweredReason: ragResult.unansweredReason,
      category: ragResult.category,
      responseTimeMs: ragResult.responseTimeMs,
      citationsCount: ragResult.citations.length,
    });

    res.json({
      conversationId: conv.id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      metadata: {
        category: ragResult.category,
        isFallback: ragResult.isFallback,
        responseTimeMs: ragResult.responseTimeMs,
      },
    });
  } catch (err: any) {
    console.error('[API] Error in /conversations/:id/messages:', err);
    res.status(500).json({
      error: 'Error generating grounded campus response',
      details: err.message,
    });
  }
});

// Feedback on a message (helpful / unhelpful)
apiRouter.post('/conversations/:id/feedback', (req: Request, res: Response) => {
  const { id } = req.params;
  const { messageId, feedback } = req.body;

  if (!messageId || !['helpful', 'unhelpful'].includes(feedback)) {
    return res.status(400).json({ error: 'Valid messageId and feedback ("helpful" | "unhelpful") required.' });
  }

  const success = store.updateMessageFeedback(id, messageId, feedback);
  if (!success) {
    return res.status(404).json({ error: 'Message or conversation not found' });
  }

  res.json({ success: true, messageId, feedback });
});

// -------------------------------------------------------------
// Knowledge Base Document Endpoints
// -------------------------------------------------------------

// List all documents (Public read for search reference, but admin can see all)
apiRouter.get('/documents', (_req: Request, res: Response) => {
  try {
    const docs = store.getDocuments().map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      filename: d.filename,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      chunkCount: d.chunks.length,
      active: d.active,
      isDemo: d.isDemo,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve documents', details: err.message });
  }
});

// Get single document with chunks
apiRouter.get('/documents/:id', (req: Request, res: Response) => {
  try {
    const doc = store.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve document', details: err.message });
  }
});

// Upload or create new document (Admin only)
apiRouter.post('/documents', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { title, category, filename, content, base64Data, mimeType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Document title is required.' });
    }

    let parsedContent = '';
    let docSize = 0;

    if (base64Data) {
      // Process uploaded file buffer (PDF or TXT)
      const buffer = Buffer.from(base64Data, 'base64');
      docSize = buffer.length;
      parsedContent = await extractTextFromBuffer(buffer, mimeType || 'application/pdf', filename || 'document.pdf');
    } else if (content) {
      parsedContent = content.trim();
      docSize = Buffer.byteLength(parsedContent, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Either document text content or base64Data file payload is required.' });
    }

    if (!parsedContent || parsedContent.trim().length < 15) {
      return res.status(400).json({
        error: 'The uploaded document contains insufficient or unreadable text. Please provide clear readable text or PDF with extractable text.',
      });
    }

    const validCategories: KnowledgeDocument['category'][] = [
      'Academic',
      'Financial Aid',
      'Housing & Dining',
      'Health & Wellness',
      'Campus Transit',
      'General',
    ];
    const cat = validCategories.includes(category) ? category : 'General';

    const newDoc = store.addDocument({
      title: title.trim(),
      category: cat,
      filename: filename || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`,
      mimeType: mimeType || 'text/plain',
      sizeBytes: docSize,
      content: parsedContent,
      active: true,
      isDemo: false,
    });

    res.status(201).json({
      message: 'Document successfully parsed, chunked, and indexed into campus knowledge base.',
      document: {
        id: newDoc.id,
        title: newDoc.title,
        category: newDoc.category,
        chunkCount: newDoc.chunks.length,
        sizeBytes: newDoc.sizeBytes,
        active: newDoc.active,
      },
    });
  } catch (err: any) {
    console.error('[API] Document upload error:', err);
    res.status(500).json({ error: 'Failed to process document upload', details: err.message });
  }
});

// Toggle document active status (Admin only)
apiRouter.patch('/documents/:id/toggle', requireAdminRole, (req: Request, res: Response) => {
  try {
    const updated = store.toggleDocumentActive(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({
      id: updated.id,
      title: updated.title,
      active: updated.active,
      message: updated.active
        ? 'Document is now active in RAG knowledge retrieval'
        : 'Document has been deactivated and excluded from retrieval',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle document', details: err.message });
  }
});

// Delete document (Admin only)
apiRouter.delete('/documents/:id', requireAdminRole, (req: Request, res: Response) => {
  try {
    const deleted = store.deleteDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true, message: 'Document removed from knowledge base' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete document', details: err.message });
  }
});

// Reset demonstration documents (Admin only)
apiRouter.post('/documents/reset-demo', requireAdminRole, (_req: Request, res: Response) => {
  try {
    const docs = store.resetDemoDocuments();
    res.json({
      message: 'Demonstration campus policies reset to official template.',
      count: docs.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset demo documents', details: err.message });
  }
});

// -------------------------------------------------------------
// Admin Analytics & Unanswered Queries (Admin only)
// -------------------------------------------------------------

apiRouter.get('/admin/analytics', requireAdminRole, (_req: Request, res: Response) => {
  try {
    const stats = store.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate analytics', details: err.message });
  }
});

// Mark unanswered query as resolved (e.g., after adding documentation)
apiRouter.post('/admin/unanswered/:id/resolve', requireAdminRole, (req: Request, res: Response) => {
  try {
    const success = store.resolveUnansweredQuery(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Query log not found' });
    }
    res.json({ success: true, message: 'Unanswered query marked as resolved' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve query', details: err.message });
  }
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  ConversationSummary,
  Conversation,
  KnowledgeDocumentSummary,
  Citation,
  SystemStatus,
} from './types';
import { CampusApi } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { DocumentsView } from './components/DocumentsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CitationModal } from './components/CitationModal';
import { UploadDocumentModal } from './components/UploadDocumentModal';
import { ChunkInspectorModal } from './components/ChunkInspectorModal';
import { SystemNoticeModal } from './components/SystemNoticeModal';

export default function App() {
  const [role, setRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'analytics'>('chat');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocumentSummary[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Modals
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [inspectDocId, setInspectDocId] = useState<string | null>(null);
  const [isSystemNoticeOpen, setIsSystemNoticeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Loading states
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // Load system status & documents on start
  const refreshSystem = useCallback(async () => {
    try {
      const [status, docs] = await Promise.all([
        CampusApi.getSystemStatus(),
        CampusApi.getDocuments(),
      ]);
      setSystemStatus(status);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load initial system status:', err);
    }
  }, []);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const list = await CampusApi.getConversations();
      setConversations(list);
      // If we don't have an active conversation and conversations exist, select the first one
      if (list.length > 0 && !activeConversationId) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [activeConversationId]);

  useEffect(() => {
    refreshSystem();
    loadConversations();
  }, [refreshSystem, loadConversations]);

  // Select and load single conversation
  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const conv = await CampusApi.getConversation(id);
      setActiveConversation(conv);
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  // Start new conversation
  const handleNewConversation = async () => {
    try {
      const newConv = await CampusApi.createConversation('New Student Inquiry');
      setConversations((prev) => [
        { id: newConv.id, title: newConv.title, createdAt: newConv.createdAt, updatedAt: newConv.updatedAt },
        ...prev,
      ]);
      setActiveConversationId(newConv.id);
      setActiveConversation(newConv);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await CampusApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setActiveConversation(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoadingMessage) return;

    let convId = activeConversationId;

    // If no conversation exists yet, create one
    if (!convId) {
      try {
        const newConv = await CampusApi.createConversation(content.slice(0, 40));
        convId = newConv.id;
        setActiveConversationId(newConv.id);
        setActiveConversation(newConv);
        setConversations((prev) => [
          { id: newConv.id, title: newConv.title, createdAt: newConv.createdAt, updatedAt: newConv.updatedAt },
          ...prev,
        ]);
      } catch (err) {
        console.error('Failed to initialize conversation for message:', err);
        return;
      }
    }

    // Optimistic UI for user message
    const tempUserMsgId = `temp-${Date.now()}`;
    const optimisticUserMsg = {
      id: tempUserMsgId,
      role: 'user' as const,
      content,
      createdAt: new Date().toISOString(),
    };

    setActiveConversation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, optimisticUserMsg],
      };
    });

    setIsLoadingMessage(true);

    try {
      const response = await CampusApi.sendMessage(convId, content);

      // Update conversation with real user message and assistant answer
      setActiveConversation((prev) => {
        if (!prev) return null;
        const filtered = prev.messages.filter((m) => m.id !== tempUserMsgId);
        return {
          ...prev,
          messages: [...filtered, response.userMessage, response.assistantMessage],
        };
      });

      // Refresh conversations list to update title if it changed
      loadConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      // Add error message to conversation
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content: `Error: Could not retrieve answer from campus knowledge base (${err.message || 'Server error'}). Please try again.`,
              createdAt: new Date().toISOString(),
              isFallback: true,
            },
          ],
        };
      });
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Refresh documents after admin upload or delete
  const refreshDocuments = async () => {
    try {
      const docs = await CampusApi.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-slate-900">
      {/* Global Header */}
      <Header
        role={role}
        onRoleChange={setRole}
        systemStatus={systemStatus}
        onOpenSystemNotice={() => setIsSystemNoticeOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role={role}
          docCount={documents.length}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Switching */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {activeTab === 'chat' && (
            <ChatView
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessage}
              onOpenCitation={(citation) => setSelectedCitation(citation)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onRefresh={refreshDocuments}
              role={role}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onInspectDocument={(id) => setInspectDocId(id)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              role={role}
              onOpenUpload={() => {
                setActiveTab('documents');
                setIsUploadModalOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          refreshDocuments();
          refreshSystem();
        }}
        role={role}
      />

      {/* Chunk Inspector Modal */}
      <ChunkInspectorModal
        documentId={inspectDocId}
        onClose={() => setInspectDocId(null)}
      />

      {/* System Notice & Storage Architecture Modal */}
      <SystemNoticeModal
        isOpen={isSystemNoticeOpen}
        onClose={() => setIsSystemNoticeOpen(false)}
        status={systemStatus}
      />
    </div>
  );
}

import { GoogleGenAI } from '@google/genai';
import { store, Chunk, Citation } from './data/store';

// Initialize Gemini client strictly server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

// Tokenize text into normalized words, ignoring stop words
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'was', 'were',
    'it', 'its', 'this', 'that', 'with', 'by', 'as', 'can', 'do', 'does', 'how', 'what', 'when',
    'where', 'who', 'which', 'why', 'i', 'my', 'me', 'we', 'our', 'you', 'your'
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

// Score a chunk against user query
function scoreChunk(chunk: Chunk, query: string, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const lowerChunk = chunk.text.toLowerCase();
  const lowerSection = chunk.sectionTitle.toLowerCase();
  const lowerDoc = chunk.docTitle.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let score = 0;

  // Exact query phrase match in chunk
  if (lowerChunk.includes(lowerQuery)) {
    score += 8.0;
  }

  // Exact query phrase in section title
  if (lowerSection.includes(lowerQuery)) {
    score += 10.0;
  }

  // Token matches
  for (const token of queryTokens) {
    // Match in section title (high weight)
    if (lowerSection.includes(token)) {
      score += 3.5;
    }
    // Match in doc title
    if (lowerDoc.includes(token)) {
      score += 2.0;
    }
    // Match in chunk body
    const regex = new RegExp(`\\b${token}\\b`, 'gi');
    const matches = lowerChunk.match(regex);
    if (matches) {
      score += Math.min(matches.length * 1.2, 4.0);
    }
  }

  // Bigram boost
  for (let i = 0; i < queryTokens.length - 1; i++) {
    const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
    if (lowerChunk.includes(bigram)) {
      score += 2.5;
    }
  }

  return score;
}

// Retrieve top relevant chunks from active knowledge base
export function retrieveContext(query: string, topK = 4): ScoredChunk[] {
  const chunks = store.getAllActiveChunks();
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  const scored: ScoredChunk[] = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, query, queryTokens),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return topK chunks with score > threshold
  return scored.filter((s) => s.score > 1.0).slice(0, topK);
}

// Fallback response generator when no API key or when model is unreachable
function generateLocalFallbackAnswer(query: string, retrieved: ScoredChunk[]): {
  answer: string;
  citations: Citation[];
  isFallback: boolean;
  unansweredReason?: string;
} {
  if (retrieved.length === 0) {
    return {
      answer: `I could not find official information regarding "${query}" in the active campus knowledge base. \n\nTo ensure you receive accurate and up-to-date guidance, please contact the appropriate university office:\n- **Academic & Registration**: Office of the Registrar (registrar@university.edu)\n- **Financial Aid**: Student Financial Services (finaid@university.edu)\n- **Housing**: Department of Residential Life (housing@university.edu)\n- **Health & Crisis**: Student Health Center or CAPS Crisis Line (555) 019-HELP\n\nCampus administrators have been notified to review and index documentation for this topic.`,
      citations: [],
      isFallback: true,
      unansweredReason: 'No relevant policy passages found in campus knowledge base',
    };
  }

  const primary = retrieved[0].chunk;
  const citations: Citation[] = retrieved.map((r) => ({
    docId: r.chunk.docId,
    docTitle: r.chunk.docTitle,
    sectionTitle: r.chunk.sectionTitle,
    excerpt: r.chunk.text.slice(0, 200) + '...',
  }));

  return {
    answer: `Based on **${primary.docTitle}** (*${primary.sectionTitle}*):\n\n${primary.text}\n\n*Source: Official Campus Knowledge Base*`,
    citations,
    isFallback: false,
  };
}

export interface RAGResult {
  answer: string;
  citations: Citation[];
  isFallback: boolean;
  unansweredReason?: string;
  category: 'Academic' | 'Financial Aid' | 'Housing & Dining' | 'Health & Wellness' | 'Campus Transit' | 'General';
  responseTimeMs: number;
}

// Guess broad category based on query
function detectCategory(query: string): 'Academic' | 'Financial Aid' | 'Housing & Dining' | 'Health & Wellness' | 'Campus Transit' | 'General' {
  const q = query.toLowerCase();
  if (q.includes('grade') || q.includes('class') || q.includes('drop') || q.includes('add') || q.includes('course') || q.includes('gpa') || q.includes('probation') || q.includes('dean') || q.includes('incomplete') || q.includes('professor') || q.includes('exam')) {
    return 'Academic';
  }
  if (q.includes('aid') || q.includes('fafsa') || q.includes('grant') || q.includes('emergency fund') || q.includes('tuition') || q.includes('payment') || q.includes('fee') || q.includes('scholarship') || q.includes('bursar') || q.includes('sap')) {
    return 'Financial Aid';
  }
  if (q.includes('housing') || q.includes('dorm') || q.includes('room') || q.includes('quiet') || q.includes('roommate') || q.includes('lockout') || q.includes('key') || q.includes('residence') || q.includes('visitor') || q.includes('guest')) {
    return 'Housing & Dining';
  }
  if (q.includes('health') || q.includes('counseling') || q.includes('caps') || q.includes('mental') || q.includes('clinic') || q.includes('crisis') || q.includes('therapy') || q.includes('vaccine') || q.includes('immuniz') || q.includes('doctor')) {
    return 'Health & Wellness';
  }
  if (q.includes('park') || q.includes('car') || q.includes('shuttle') || q.includes('permit') || q.includes('bus') || q.includes('transit') || q.includes('saferide') || q.includes('ticket') || q.includes('citation')) {
    return 'Campus Transit';
  }
  return 'General';
}

export async function askCampusQuery(
  userQuery: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<RAGResult> {
  const startTime = Date.now();
  const category = detectCategory(userQuery);
  const retrieved = retrieveContext(userQuery, 4);

  // If no knowledge chunks match even minimally, we trigger strict grounding fallback
  if (retrieved.length === 0) {
    const elapsed = Date.now() - startTime;
    return {
      answer: `I could not find official information regarding "${userQuery}" in the current campus knowledge base.\n\nTo ensure you receive accurate and authoritative assistance, please contact the appropriate university department:\n- **Academic & Registration**: Office of the Registrar (registrar@university.edu)\n- **Financial Aid & Grants**: Student Financial Services (finaid@university.edu)\n- **Housing & Dorms**: Department of Residential Life (housing@university.edu)\n- **Health & Crisis**: Student Health Center or CAPS Crisis Line (555) 019-HELP\n\nCampus administrators have flagged this topic to add relevant documentation.`,
      citations: [],
      isFallback: true,
      unansweredReason: 'No relevant policy passages found in campus knowledge base',
      category,
      responseTimeMs: elapsed,
    };
  }

  // Build context payload
  const contextPassages = retrieved.map((r, i) => {
    return `[PASSAGE_${i + 1}]
Source Document: "${r.chunk.docTitle}"
Section: "${r.chunk.sectionTitle}"
Doc ID: ${r.chunk.docId}
Content:
${r.chunk.text}`;
  }).join('\n\n---\n\n');

  const systemInstruction = `You are CampusQuery AI, the official verified university student support assistant.
Your sole mission is to answer student questions accurately, politely, and strictly grounded in the provided official campus policy passages.

CRITICAL RULES:
1. STRICT SOURCE GROUNDING: Base your answer EXCLUSIVELY on the provided campus passages below. Do NOT fabricate, assume, or draw from outside knowledge or general internet information.
2. CITATIONS: Whenever stating a policy rule, deadline, dollar amount, penalty, or requirement, cite the source passage using the exact bracket format: [Doc: <docTitle>, Section: <sectionTitle>].
3. UNAVAILABLE OR AMBIGUOUS INFORMATION: If the student's question is NOT answered in the passages below, or if the passage does not provide enough specific detail, you MUST explicitly state that this information is not available in current campus policy documents. Guide the student to the appropriate campus office (such as the Office of the Registrar, Financial Aid, Residential Life, or Student Health Center). Do NOT invent policies.
4. TONE: Welcoming, empathetic, clear, professional, and well-structured with bullet points and bold headers when helpful.
5. Provide concise, direct answers so students quickly know what to do, what deadlines apply, and any applicable fees.`;

  const userPrompt = `OFFICIAL CAMPUS KNOWLEDGE BASE PASSAGES:
=========================================
${contextPassages}
=========================================

RECENT CONVERSATION HISTORY:
${history.slice(-4).map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`).join('\n')}

STUDENT'S QUESTION:
${userQuery}

Provide a comprehensive, accurate answer grounded in the passages above. Remember to cite your sources using [Doc: <docTitle>, Section: <sectionTitle>] and clearly state if any aspect of the question is not covered in the official passages.`;

  try {
    if (!apiKey) {
      console.warn('[RAG] No GEMINI_API_KEY detected. Using local fallback retrieval.');
      const local = generateLocalFallbackAnswer(userQuery, retrieved);
      return {
        ...local,
        category,
        responseTimeMs: Date.now() - startTime,
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high factual precision
      },
    });

    const answerText = response.text || '';
    const elapsed = Date.now() - startTime;

    // Detect if model stated the information is unavailable / not covered
    const lowerAns = answerText.toLowerCase();
    const isFallback =
      lowerAns.includes('not available in current campus') ||
      lowerAns.includes('cannot be found in the provided') ||
      lowerAns.includes('not covered in the official') ||
      lowerAns.includes('does not contain information') ||
      lowerAns.includes('not specified in the provided documents');

    // Extract citations matching retrieved chunks
    const citations: Citation[] = [];
    const usedDocKeys = new Set<string>();

    for (const r of retrieved) {
      // Check if doc title or section title appears in the answer
      const hasDocMention = answerText.includes(r.chunk.docTitle) ||
        answerText.includes(r.chunk.sectionTitle) ||
        r.score > 3.0;

      const key = `${r.chunk.docId}-${r.chunk.sectionTitle}`;
      if (hasDocMention && !usedDocKeys.has(key)) {
        usedDocKeys.add(key);
        citations.push({
          docId: r.chunk.docId,
          docTitle: r.chunk.docTitle,
          sectionTitle: r.chunk.sectionTitle,
          excerpt: r.chunk.text.slice(0, 240) + '...',
        });
      }
    }

    // If no citations matched yet but we have high score chunk, include top 1
    if (citations.length === 0 && !isFallback && retrieved.length > 0) {
      citations.push({
        docId: retrieved[0].chunk.docId,
        docTitle: retrieved[0].chunk.docTitle,
        sectionTitle: retrieved[0].chunk.sectionTitle,
        excerpt: retrieved[0].chunk.text.slice(0, 240) + '...',
      });
    }

    return {
      answer: answerText,
      citations: isFallback ? [] : citations,
      isFallback,
      unansweredReason: isFallback ? 'Information not covered in current campus documentation' : undefined,
      category,
      responseTimeMs: elapsed,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[RAG] Error calling Gemini API:', errorMsg);
    // Provide grounded fallback answer from retrieved documents
    const fallback = generateLocalFallbackAnswer(userQuery, retrieved);
    return {
      ...fallback,
      category,
      responseTimeMs: Date.now() - startTime,
    };
  }
}

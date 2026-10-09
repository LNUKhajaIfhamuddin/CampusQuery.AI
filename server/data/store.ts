import fs from 'fs';
import path from 'path';

export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  sectionTitle: string;
  text: string;
  charCount: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'Academic' | 'Financial Aid' | 'Housing & Dining' | 'Health & Wellness' | 'Campus Transit' | 'General';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  chunks: Chunk[];
  active: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
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

interface DatabaseSchema {
  documents: KnowledgeDocument[];
  conversations: Conversation[];
  queryLogs: QueryLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'campusquery-db.json');

// Initial Sample University Documents for Demonstration
const SAMPLE_DOCS: Omit<KnowledgeDocument, 'id' | 'chunks' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Undergraduate Academic Regulations & Grading Handbook (2025-2026)',
    category: 'Academic',
    filename: 'academic_regulations_2025_2026.txt',
    mimeType: 'text/plain',
    sizeBytes: 4200,
    active: true,
    isDemo: true,
    content: `CAMPUS UNIVERSITY - UNDERGRADUATE ACADEMIC POLICIES & PROCEDURES (2025-2026)

Section 1: Course Add / Drop and Census Deadlines
Students may add or drop classes without academic or financial penalty through 11:59 PM on the 10th instructional day of the fall or spring semester, known as the Official University Census Date. Classes dropped before or on Census Date leave no mark on the official transcript, and 100% of applicable tuition charges for dropped units are credited back to the student account.
Courses dropped after Census Date through the end of the 10th week of the semester require an instructor signature and will result in an official "W" (Withdrawal) notation on the transcript. Withdrawals carry no GPA penalty, but tuition is non-refundable. Students are permitted a maximum lifetime limit of 18 semester withdrawal units across their entire undergraduate career. Withdrawals requested after Week 10 are considered Emergency Withdrawals and require documented catastrophic circumstances approved by the Dean of Undergraduate Studies.

Section 2: Grade Forgiveness & Course Repetition Policy
Undergraduate students are permitted to repeat up to 16 semester credit units for Grade Forgiveness. When an eligible course is repeated for forgiveness:
1. Only the newly earned grade is calculated into the cumulative grade point average (GPA).
2. The initial grade earned remains visible on the official transcript annotated with an "R" (Repeated) notation.
3. Grade forgiveness only applies to courses where the first grade earned was a C-, D+, D, D-, or F.
4. An individual course may only be repeated twice (maximum of three total attempts). A third attempt requires prior written authorization from the Department Chair and College Dean.
5. If a student exhausts their 16 units of Grade Forgiveness, subsequent repeated units will be averaged together with the original grade in the GPA calculation.

Section 3: Incomplete ("I") Grade Guidelines
An Incomplete ("I") grade may be assigned by a course instructor only when:
- The student has successfully completed at least 70% of total coursework with a passing grade of C or better.
- An unforeseen and documented emergency (medical illness, bereavement, or military obligation) prevents timely completion of final examinations or terminal projects.
- An Incomplete Contract is formally signed between the instructor and student via the Registrar's Portal before final grades are submitted.
All incomplete work must be submitted no later than the end of the subsequent regular semester (Fall or Spring), regardless of enrollment status. If the coursework is not submitted within this timeline, the "I" grade automatically converts to a permanent grade of "F" (or "No Credit").

Section 4: Dean's Honor List Requirements
To qualify for the Dean's Honor List in any given Fall or Spring semester, an undergraduate student must:
- Complete a minimum of 12 letter-graded semester units (courses taken for Pass/No Pass do not count toward this 12-unit minimum).
- Attain a semester GPA of 3.50 or higher.
- Have no grades of "I", "F", or "NC" on their semester record.
Dean's Honor citations appear permanently on official academic transcripts.

Section 5: Academic Standing, Probation, and Disqualification
A student is placed on Academic Probation whenever their cumulative University GPA falls below 2.00. While on Academic Probation, students are limited to enrolling in a maximum of 13 credit units per term and must meet with an Academic Success Counselor prior to registration.
If a student on academic probation fails to raise their cumulative GPA to at least 2.00 after two consecutive regular semesters, they become subject to Academic Disqualification. Disqualified students are separated from the university for at least one calendar year before being eligible to petition for academic reinstatement.`
  },
  {
    title: 'Student Financial Aid & Emergency Relief Grants Handbook',
    category: 'Financial Aid',
    filename: 'financial_aid_and_emergency_grants.txt',
    mimeType: 'text/plain',
    sizeBytes: 3900,
    active: true,
    isDemo: true,
    content: `CAMPUS UNIVERSITY - OFFICE OF FINANCIAL AID & SCHOLARSHIPS

Section 1: Application Priority Deadlines
The annual priority filing deadline for the Free Application for Federal Student Aid (FAFSA) and the State Dream Act Application is March 2 for the upcoming academic year. Students who submit after March 2 are evaluated on a funds-available basis and may forfeit state grant entitlements.
All requested verification documents, tax transcripts, and household verification forms must be uploaded to the Student Financial Aid Portal by June 1 to guarantee disbursement prior to the start of Fall semester classes.

Section 2: Satisfactory Academic Progress (SAP) Standards
Federal and state regulations require all financial aid recipients to maintain Satisfactory Academic Progress (SAP) across three criteria:
1. Qualitative Measure (GPA): Undergraduate students must maintain a cumulative GPA of at least 2.00. Graduate students must maintain at least 3.00.
2. Quantitative Measure (Pace of Progression): Students must successfully complete at least 67% of all cumulative units attempted (calculated by dividing completed units by attempted units, including transfer credits).
3. Maximum Timeframe: Students must complete their degree program within 150% of the published program length (for a 120-unit bachelor's degree, the maximum allowed attempted units is 180 units).
Students failing to meet SAP are placed on Financial Aid Warning for one semester with continued aid eligibility. If SAP criteria are not met by the end of the warning semester, aid is suspended. Suspended students may submit an SAP Appeal with third-party documentation for extenuating circumstances.

Section 3: Dean's Student Emergency Relief Fund (Emergency Grants)
The University Student Emergency Relief Fund provides one-time emergency grants of up to $1,500 per academic year to currently enrolled students facing sudden, unforeseen financial hardships that threaten their academic continuity.
Eligible emergency expenses include:
- Unanticipated medical, dental, or prescription expenses not covered by insurance.
- Immediate housing instability, risk of eviction, or temporary emergency lodging.
- Urgent food insecurity or utility shut-off notices.
- Essential academic technology replacement (such as a broken laptop required for coursework).
Ineligible expenses include: ongoing university tuition, credit card debt, non-essential travel, or discretionary living costs.
Applications are reviewed within 2 to 3 business days by the Student Life Emergency Committee. Approved grants are disbursed via direct deposit within 48 hours and do not require repayment.

Section 4: Tuition Installment Payment Plans
The Bursar's Office offers semester Tuition Installment Plans allowing tuition and campus fees to be divided into 3 or 4 equal monthly payments:
- 4-Payment Plan: Due on August 15, September 15, October 15, and November 15 (Fall term).
- A non-refundable $35 administrative enrollment fee is applied per semester plan.
- A $25 late fee is assessed for any installment received after the 5-day grace period. Students with overdue balances are subject to a registration hold on future terms.`
  },
  {
    title: 'Residential Life, Housing Regulations & Move-in Policies',
    category: 'Housing & Dining',
    filename: 'housing_and_residential_regulations.txt',
    mimeType: 'text/plain',
    sizeBytes: 3700,
    active: true,
    isDemo: true,
    content: `CAMPUS UNIVERSITY - DEPARTMENT OF HOUSING & RESIDENTIAL LIFE

Section 1: Quiet Hours & Courtesy Policy
To ensure an environment conducive to studying and sleep, designated Quiet Hours are enforced in all university residence halls and campus apartments:
- Sunday through Thursday: 10:00 PM to 8:00 AM.
- Friday and Saturday: 12:00 Midnight to 9:00 AM.
Courtesy Hours are in effect 24 hours a day, 7 days a week. During Courtesy Hours, residents must promptly reduce noise if requested by a neighbor or Resident Advisor (RA).
During Final Exam Weeks (commencing at 10:00 PM on the Friday before finals begin through the end of the term), continuous 24-Hour Quiet Hours are strictly enforced throughout all residential communities.

Section 2: Room Change and Freeze Periods
A two-week "Room Freeze" is enforced during the first two instructional weeks of both Fall and Spring semesters. During the Room Freeze, no room transfer requests will be accepted or processed while staff confirm building occupancy.
Beginning at 9:00 AM on Monday of Week 3, the Housing Room Transfer Portal opens. Students wishing to swap rooms must:
1. Complete the Room Swap Request form in the portal.
2. Meet with their Resident Director (RD) to discuss room dynamics and resolve interpersonal conflicts if applicable.
3. Receive written authorization from Housing Assignments before moving any personal possessions. Unauthorized room swaps result in a $100 administrative penalty fee per resident.

Section 3: Guest & Overnight Visitor Rules
Residents may host up to two guests simultaneously. Overnight visitors may stay in a residence hall for a maximum of 3 consecutive nights and no more than 6 total nights within any 30-day calendar period.
All guests must be registered at the building security desk upon arrival and must present a government-issued photo ID. Overnight guests must receive express consent from all room or suite roommates prior to arrival.

Section 4: Lockouts and Key Replacement
Residents locked out of their room or suite may request assistance from the Front Desk or the On-Duty RA:
- Each resident receives one (1) complimentary lockout assistance per academic semester.
- Subsequent lockouts incur a $15 service charge billed to the student bursar account.
- Lost hard metal keys must be reported immediately for resident safety; a complete cylinder core re-key and replacement fee is $75. Lost electronic tap keycards cost $25 to re-issue.`
  },
  {
    title: 'Student Health Center & Counseling Psychological Services (CAPS) Guide',
    category: 'Health & Wellness',
    filename: 'student_health_and_wellness_guide.txt',
    mimeType: 'text/plain',
    sizeBytes: 3600,
    active: true,
    isDemo: true,
    content: `CAMPUS UNIVERSITY - STUDENT HEALTH & WELLNESS CENTER

Section 1: Student Health Clinic Hours and Services
The Student Health Center is located in Health Sciences Building 400.
Operating Hours:
- Monday through Thursday: 8:00 AM to 5:30 PM
- Friday: 9:00 AM to 4:30 PM
- Saturday & Sunday: Closed (after-hours telehealth triage available via phone).
Services provided include routine primary care, preventative physical exams, urgent care for acute minor illness or injury, laboratory testing, STI screening, and prescription dispensary services.
Walk-in triage is available for acute symptoms (such as high fever, allergic reactions, lacerations, or asthma flare-ups) from 9:00 AM to 4:00 PM on weekdays.

Section 2: Counseling and Psychological Services (CAPS)
Every currently matriculated student paying mandatory student health fees is entitled to up to 12 free individual counseling sessions per academic year with a licensed psychologist or clinical social worker.
Initial intake triage appointments can be scheduled online or accessed via Same-Day Drop-In Triage between 10:00 AM and 3:00 PM, Monday through Friday.
Specialty counseling options include:
- Individual psychotherapy for depression, anxiety, academic stress, and life transitions.
- Unlimited drop-in wellness support groups (e.g., Graduate Student Support, First-Gen Resilience, LGBTQ+ Affinity Circle).
- Psychiatric medication evaluation and management.

Section 3: 24/7 Crisis Helpline Support
Students experiencing an acute mental health crisis, overwhelming distress, or thoughts of self-harm can contact the University 24/7 Crisis Helpline at (555) 019-HELP (4357) anytime day or night.
Students can also text the National Crisis Text Line by texting "CAMPUS" to 741741 to connect with a trained crisis counselor free of charge. In life-threatening emergencies, call University Police Dispatch at (555) 019-9111 or dial 911.

Section 4: Mandatory Immunization Compliance
All incoming undergraduate, graduate, and exchange students must submit verified immunization documentation via the Patient Portal prior to enrolling for their second semester:
- Measles, Mumps, Rubella (MMR): Two doses or laboratory titer proof of immunity.
- Meningococcal ACWY (MenACWY): One dose on or after age 16 for all students living in campus housing.
- Tetanus-Diphtheria-Pertussis (Tdap): One booster dose within the past 10 years.
A registration hold is automatically placed on course enrollment for students failing to complete immunization clearance by November 1 (Fall entrants) or April 1 (Spring entrants).`
  },
  {
    title: 'Campus Parking Regulations, Transportation & Shuttle Services',
    category: 'Campus Transit',
    filename: 'parking_transportation_rules.txt',
    mimeType: 'text/plain',
    sizeBytes: 3500,
    active: true,
    isDemo: true,
    content: `CAMPUS UNIVERSITY - PARKING & TRANSPORTATION SERVICES

Section 1: Student Parking Permit Categories
Parking permits are required in all campus lots Monday through Friday from 7:00 AM to 8:00 PM. All permits are virtual and linked directly to student license plates.
Available Permit Tiers:
- Commuter Permit (Gold Tier): Valid in Surface Lots 1 through 9, North Parking Structure, and West Parking Structure. Cost: $185 per semester.
- Resident Student Permit (Blue Tier): Restricted to students living in campus housing. Valid exclusively in East Residential Parking Structure Floors 2 through 6. Cost: $210 per semester.
- Evening Only Permit: Valid after 4:00 PM in all student commuter lots. Cost: $95 per semester.
- Daily Visitor Passes: Available for $8 per day via the ParkMobile mobile app (Zone 4402).

Section 2: Campus Blue Line Shuttle & Night Escort Service
The Blue Line Shuttle provides continuous, free bus transit connecting university residential communities, academic buildings, and the regional Transit Hub:
- Operating Schedule: Weekdays every 8 to 12 minutes between 7:00 AM and 10:30 PM.
- Weekend Schedule: Runs every 25 minutes between 10:00 AM and 7:00 PM.
Night Escort & SafeRide:
Between 9:00 PM and 3:00 AM every night, students traveling alone across campus or within a 1.5-mile perimeter can request a free on-demand vehicular SafeRide or walking safety escort by calling (555) 019-RIDE or using the Campus Safe mobile app.

Section 3: Citation Appeals & Violation Enforcement
Parking regulations are enforced year-round. Vehicles parked without a valid virtual permit or in reserved ADA / Faculty stalls are subject to citations ($45 to $250).
Appeal Guidelines:
- Citations must be formally appealed online via the Parking Portal within 14 calendar days of issuance.
- Appeals submitted after 14 calendar days will not be considered under any circumstances.
- Lack of parking spaces, ignorance of regulations, running late for an exam, or inclement weather do not constitute valid grounds for citation dismissal.`
  }
];

// Helper: Split text into coherent chunks by section or paragraph
export function chunkText(docId: string, docTitle: string, fullText: string): Chunk[] {
  const chunks: Chunk[] = [];
  // Split on "Section " or double newlines
  const sections = fullText.split(/\n(?=Section\s+\d+:)/g);

  let chunkIdx = 1;
  for (const sec of sections) {
    const trimmed = sec.trim();
    if (!trimmed) continue;

    // Detect section title
    const firstLineMatch = trimmed.match(/^(Section\s+\d+:[^\n]+)/i);
    const sectionTitle = firstLineMatch ? firstLineMatch[1].trim() : 'General Policy';

    // If section is long, sub-chunk into ~600-800 char pieces
    if (trimmed.length > 900) {
      const paragraphs = trimmed.split(/\n\n+/);
      let currentSub = '';
      for (const p of paragraphs) {
        if ((currentSub + '\n\n' + p).length > 850 && currentSub.length > 200) {
          chunks.push({
            id: `${docId}-chunk-${chunkIdx++}`,
            docId,
            docTitle,
            sectionTitle,
            text: currentSub.trim(),
            charCount: currentSub.trim().length,
          });
          currentSub = p;
        } else {
          currentSub = currentSub ? currentSub + '\n\n' + p : p;
        }
      }
      if (currentSub.trim()) {
        chunks.push({
          id: `${docId}-chunk-${chunkIdx++}`,
          docId,
          docTitle,
          sectionTitle,
          text: currentSub.trim(),
          charCount: currentSub.trim().length,
        });
      }
    } else {
      chunks.push({
        id: `${docId}-chunk-${chunkIdx++}`,
        docId,
        docTitle,
        sectionTitle,
        text: trimmed,
        charCount: trimmed.length,
      });
    }
  }

  return chunks;
}

class Store {
  private db: DatabaseSchema = {
    documents: [],
    conversations: [],
    queryLogs: [],
  };
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.db = {
          documents: parsed.documents || [],
          conversations: parsed.conversations || [],
          queryLogs: parsed.queryLogs || [],
        };
      }

      // If no documents exist, seed sample campus knowledge base
      if (!this.db.documents || this.db.documents.length === 0) {
        this.seedSampleDocs();
      }

      // Seed initial sample analytics if empty for realistic dashboard display
      if (!this.db.queryLogs || this.db.queryLogs.length === 0) {
        this.seedSampleAnalytics();
      }

      this.initialized = true;
      this.save();
    } catch (err) {
      console.error('[Store] Error during init:', err);
      this.seedSampleDocs();
      this.seedSampleAnalytics();
      this.initialized = true;
    }
  }

  private seedSampleDocs() {
    const now = new Date().toISOString();
    this.db.documents = SAMPLE_DOCS.map((doc, idx) => {
      const docId = `doc-campus-${idx + 1}`;
      const chunks = chunkText(docId, doc.title, doc.content);
      return {
        ...doc,
        id: docId,
        chunks,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  private seedSampleAnalytics() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sampleQueries: Array<{ q: string; answered: boolean; reason?: string; cat: string; ms: number; count: number; dayOffset: number }> = [
      { q: 'How many times can I repeat a course for grade forgiveness?', answered: true, cat: 'Academic', ms: 850, count: 2, dayOffset: 0 },
      { q: 'What is the maximum emergency grant amount I can receive?', answered: true, cat: 'Financial Aid', ms: 920, count: 1, dayOffset: 0 },
      { q: 'Can I park in East Structure with a commuter gold pass?', answered: true, cat: 'Campus Transit', ms: 780, count: 1, dayOffset: 1 },
      { q: 'What are the quiet hours on Saturday night in the dorms?', answered: true, cat: 'Housing & Dining', ms: 810, count: 1, dayOffset: 1 },
      { q: 'How do I apply for the campus study abroad exchange in Madrid?', answered: false, reason: 'Information not in campus knowledge base (International Programs missing)', cat: 'Academic', ms: 640, count: 0, dayOffset: 1 },
      { q: 'How many free counseling sessions do I get per year?', answered: true, cat: 'Health & Wellness', ms: 890, count: 1, dayOffset: 2 },
      { q: 'Where do I drop off my chemistry lab goggles locker key?', answered: false, reason: 'Department-specific policy not indexed', cat: 'Academic', ms: 590, count: 0, dayOffset: 2 },
      { q: 'What happens if I drop a class after Census date?', answered: true, cat: 'Academic', ms: 910, count: 2, dayOffset: 3 },
      { q: 'Are electric scooters allowed inside residence hall rooms?', answered: false, reason: 'Specific electric micromobility policy not documented', cat: 'Housing & Dining', ms: 630, count: 0, dayOffset: 3 },
      { q: 'What is the priority filing deadline for FAFSA?', answered: true, cat: 'Financial Aid', ms: 790, count: 1, dayOffset: 4 },
      { q: 'How much does the replacement tap card cost for dorm lockouts?', answered: true, cat: 'Housing & Dining', ms: 840, count: 1, dayOffset: 5 },
      { q: 'How long do I have to appeal a parking citation?', answered: true, cat: 'Campus Transit', ms: 830, count: 1, dayOffset: 6 }
    ];

    this.db.queryLogs = sampleQueries.map((item, idx) => ({
      id: `log-${idx + 1}`,
      conversationId: `conv-seed-${idx + 1}`,
      query: item.q,
      answered: item.answered,
      unansweredReason: item.reason,
      category: item.cat,
      timestamp: new Date(now - item.dayOffset * oneDay - idx * 3600000).toISOString(),
      responseTimeMs: item.ms,
      citationsCount: item.count,
      resolved: false,
    }));
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Store] Failed to save DB to disk:', err);
    }
  }

  // --- Document Methods ---
  public getDocuments(): KnowledgeDocument[] {
    return this.db.documents;
  }

  public getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.db.documents.find((d) => d.id === id);
  }

  public addDocument(doc: Omit<KnowledgeDocument, 'id' | 'chunks' | 'createdAt' | 'updatedAt'>): KnowledgeDocument {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const chunks = chunkText(id, doc.title, doc.content);
    const newDoc: KnowledgeDocument = {
      ...doc,
      id,
      chunks,
      createdAt: now,
      updatedAt: now,
    };
    this.db.documents.unshift(newDoc);
    this.save();
    return newDoc;
  }

  public deleteDocument(id: string): boolean {
    const initialLen = this.db.documents.length;
    this.db.documents = this.db.documents.filter((d) => d.id !== id);
    if (this.db.documents.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public toggleDocumentActive(id: string): KnowledgeDocument | undefined {
    const doc = this.db.documents.find((d) => d.id === id);
    if (doc) {
      doc.active = !doc.active;
      doc.updatedAt = new Date().toISOString();
      this.save();
      return doc;
    }
    return undefined;
  }

  public resetDemoDocuments(): KnowledgeDocument[] {
    this.seedSampleDocs();
    this.save();
    return this.db.documents;
  }

  public getAllActiveChunks(): Chunk[] {
    return this.db.documents
      .filter((d) => d.active)
      .flatMap((d) => d.chunks);
  }

  // --- Conversation Methods ---
  public getConversations(): Omit<Conversation, 'messages'>[] {
    return this.db.conversations
      .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.db.conversations.find((c) => c.id === id);
  }

  public createConversation(title = 'New Student Inquiry'): Conversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.db.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  public addMessage(convId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    let conv = this.db.conversations.find((c) => c.id === convId);
    if (!conv) {
      conv = this.createConversation();
    }
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullMsg: ChatMessage = {
      ...message,
      id: msgId,
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(fullMsg);
    conv.updatedAt = fullMsg.createdAt;

    // If first user message, update conversation title smartly
    if (message.role === 'user' && conv.messages.filter((m) => m.role === 'user').length === 1) {
      conv.title = message.content.slice(0, 48) + (message.content.length > 48 ? '...' : '');
    }

    this.save();
    return fullMsg;
  }

  public updateMessageFeedback(convId: string, msgId: string, feedback: 'helpful' | 'unhelpful'): boolean {
    const conv = this.db.conversations.find((c) => c.id === convId);
    if (!conv) return false;
    const msg = conv.messages.find((m) => m.id === msgId);
    if (!msg) return false;
    msg.feedback = feedback;
    this.save();
    return true;
  }

  public deleteConversation(id: string): boolean {
    const initLen = this.db.conversations.length;
    this.db.conversations = this.db.conversations.filter((c) => c.id !== id);
    if (this.db.conversations.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  public clearAllConversations(): void {
    this.db.conversations = [];
    this.save();
  }

  // --- Analytics & Query Logging ---
  public logQuery(log: Omit<QueryLog, 'id' | 'timestamp' | 'resolved'>): QueryLog {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullLog: QueryLog = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    this.db.queryLogs.unshift(fullLog);
    // Keep max 1000 logs
    if (this.db.queryLogs.length > 1000) {
      this.db.queryLogs = this.db.queryLogs.slice(0, 1000);
    }
    this.save();
    return fullLog;
  }

  public getQueryLogs(): QueryLog[] {
    return this.db.queryLogs;
  }

  public resolveUnansweredQuery(id: string): boolean {
    const item = this.db.queryLogs.find((l) => l.id === id);
    if (item) {
      item.resolved = true;
      this.save();
      return true;
    }
    return false;
  }

  public getStats() {
    const totalLogs = this.db.queryLogs.length;
    const answeredLogs = this.db.queryLogs.filter((l) => l.answered);
    const unansweredLogs = this.db.queryLogs.filter((l) => !l.answered);
    const totalDocs = this.db.documents.length;
    const activeDocs = this.db.documents.filter((d) => d.active).length;
    const totalChunks = this.db.documents.reduce((acc, d) => acc + (d.active ? d.chunks.length : 0), 0);
    const totalConversations = this.db.conversations.length;

    const avgResponseTimeMs = totalLogs > 0
      ? Math.round(this.db.queryLogs.reduce((acc, l) => acc + (l.responseTimeMs || 0), 0) / totalLogs)
      : 0;

    const answeredRatePercent = totalLogs > 0
      ? Math.round((answeredLogs.length / totalLogs) * 100)
      : 100;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    for (const log of this.db.queryLogs) {
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    }

    return {
      totalQuestions: totalLogs,
      answeredQuestions: answeredLogs.length,
      unansweredQueriesCount: unansweredLogs.filter((l) => !l.resolved).length,
      answeredRatePercent,
      avgResponseTimeMs,
      totalDocuments: totalDocs,
      activeDocuments: activeDocs,
      totalKnowledgeChunks: totalChunks,
      totalConversations,
      categoryCounts,
      unansweredList: unansweredLogs.slice(0, 50),
    };
  }
}

export const store = new Store();

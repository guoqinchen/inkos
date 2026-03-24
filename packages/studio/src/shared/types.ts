// ============ Core Types ============

export interface BookSummary {
  bookId: string;
  title: string;
  genre: string;
  language: string;
  chapterCount: number;
  totalWords: number;
  status: 'idle' | 'writing' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface ChapterMeta {
  chapterId: string;
  bookId: string;
  title: string;
  status: 'draft' | 'auditing' | 'approved' | 'rejected';
  wordCount: number;
  pov?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterContent extends ChapterMeta {
  content: string; // Markdown
}

// ============ Pipeline Types ============

export interface WriteOptions {
  bookId: string;
  guidance?: string;
  pov?: string;
  wordCount?: number;
}

export interface WriteProgress {
  elapsedMs: number;
  totalChars: number;
  chineseChars: number;
  status: 'writing' | 'settling' | 'complete' | 'error';
}

export interface WriteResult {
  chapterId: string;
  title: string;
  wordCount: number;
  auditReport?: AuditReport;
}

export interface AuditOptions {
  bookId: string;
  chapterId: string;
}

export interface AuditReport {
  chapterId: string;
  issues: AuditIssue[];
  totalIssues: number;
  severeIssues: number;
  warningIssues: number;
}

export interface AuditIssue {
  severity: 'severe' | 'warning' | 'info';
  dimension: string;
  description: string;
  location?: string;
}

export interface ReviseOptions {
  bookId: string;
  chapterId: string;
  mode: 'polish' | 'spot-fix' | 'rewrite' | 'rework' | 'anti-detect';
}

// ============ Truth File Types ============

export interface TruthFile {
  name: string;
  path: string;
  content: string;
  updatedAt: string;
}

export interface TruthFiles {
  currentState: TruthFile;
  particleLedger: TruthFile;
  pendingHooks: TruthFile;
  chapterSummaries: TruthFile;
  subplotBoard: TruthFile;
  emotionalArcs: TruthFile;
  characterMatrix: TruthFile;
}

// ============ Config Types ============

export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  baseUrl: string;
  apiKey: string;
}

export interface AgentModelConfig {
  architect?: string;
  writer?: string;
  auditor?: string;
  reviser?: string;
  radar?: string;
}

export interface GlobalConfig {
  llm: LLMProviderConfig;
  models: AgentModelConfig;
  notifications: {
    telegram?: { token?: string; chatId?: string };
    feishu?: { webhook?: string };
    wechatWork?: { webhook?: string };
  };
}

// ============ Daemon Types ============

export interface DaemonStatus {
  running: boolean;
  uptimeMs: number;
  activeBooks: string[];
  queuedTasks: number;
  memoryMb: number;
}

// ============ Analytics Types ============

export interface AnalyticsData {
  bookId: string;
  totalChapters: number;
  totalWords: number;
  avgWordsPerChapter: number;
  auditPassRate: number;
  topIssueCategories: { category: string; count: number }[];
  tokenUsage?: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    avgTokensPerChapter: number;
  };
}

// ============ IPC Request/Response ============

// Pipeline
export interface WriteRequest {
  bookId: string;
  guidance?: string;
  pov?: string;
  wordCount?: number;
}

export interface WriteResponse {
  chapterId: string;
  title: string;
  wordCount: number;
}

export interface AuditRequest {
  bookId: string;
  chapterId: string;
}

export interface AuditResponse {
  chapterId: string;
  issues: AuditIssue[];
  totalIssues: number;
  severeIssues: number;
  warningIssues: number;
}

export interface ReviseRequest {
  bookId: string;
  chapterId: string;
  mode: 'polish' | 'spot-fix' | 'rewrite' | 'rework' | 'anti-detect';
}

export interface ReviseResponse {
  chapterId: string;
  success: boolean;
  newWordCount?: number;
}

// Book
export interface CreateBookRequest {
  title: string;
  genre: string;
  language?: string;
  wordCount?: number;
}

export interface CreateBookResponse {
  bookId: string;
}

// Error
export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ WebSocket Message Types ============

export type WSMessageType =
  | 'chapter-update'
  | 'truth-file-change'
  | 'pipeline-status'
  | 'daemon-event'
  | 'window-sync-request'
  | 'window-sync-response';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  bookId?: string;
  timestamp: number;
  payload: T;
}

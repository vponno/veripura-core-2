export enum UserRole {
  EXPORTER = 'EXPORTER', // New Default
  FARMER = 'FARMER', // Exporter / Producer
  PROCESSOR = 'PROCESSOR', // Co-op / Processing Station
  BUYER = 'BUYER', // Retailer / Importer
  LOGISTICS = 'LOGISTICS'
}

// --- IOTA Move Object Structure (Object-Centric) ---
export interface MoveObject {
  id: string; // UID
  owner: string; // Address
  module: string;
  type: string;
  version: number;
}

export interface Consignment extends MoveObject {
  fields: {
    owner: string;
    internal_id: string; // Foreign Key to Firestore
    data_hash: number[]; // Vector<u8>
    merkle_root?: string; // Hex string of the Merkle Tree Root
    status: string;
    timestamp: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export enum ChecklistItemStatus {
  MISSING = 'Missing',
  PENDING = 'Pending Approval',
  READY = 'Ready',
  PENDING_REVIEW = 'Pending Review',
  REJECTED = 'Rejected'
}

export enum ChecklistItemCategory {
  LOGISTICS = 'Logistics',
  CUSTOMS = 'Customs',
  TRANSPORT = 'Transport',
  CERTIFICATIONS = 'Certifications',
  REGULATORY = 'Regulatory',
  FINANCIAL = 'Financial',
  FOOD_SAFETY = 'Food Safety',
  SOCIAL_COMPLIANCE = 'Social Compliance',
  OTHER = 'Other'
}

export interface Product {
  name: string;
  quantity: string;
  hsCode: string;
  isOrganic: boolean;
  attributes?: string[]; // New: Frozen, Halal, etc.
}

export interface ExtractedPOData {
  sellerName: string;
  buyerName: string;
  originCountry: string;
  destinationCountry: string;
  products: Product[];
  securityAnalysis?: {
    isSuspicious: boolean;
    suspicionReason: string;
    tamperScore: number; // 0-100, where 100 is highly suspicious
  };
}

export interface ChecklistItem {
  id: string;
  documentName: string;
  description: string;
  issuingAgency: string;
  agencyLink: string;
  category: ChecklistItemCategory;
  status: ChecklistItemStatus;
  isMandatory?: boolean;
  analysis?: any; // AI findings and alerts
}

export type DocumentType = 'Certificate of Origin' | 'Pro-forma Invoice';

export interface ComplianceDocument {
  name: string;
  category: string;
  description?: string;
  status: 'MISSING' | 'UPLOADED' | 'VERIFIED';
  fileUrl?: string;
  fileHash?: string;
  verificationLevel?: 'GREEN' | 'YELLOW' | 'RED';
  issuingAgency?: string;
  isMandatory?: boolean;
  agencyLink?: string;
  source?: string;
}

export interface AIAnalysisResult {
  prediction: string;
  confidence: number;
  recommendations: string[];
  marketTrend: 'UP' | 'DOWN' | 'STABLE';
}

export interface ComplianceRule {
  ruleId?: string;
  regulation: string;
  description: string;
  required_document: string;
  source: string;
}

// ============================================================================
// GUARDIAN AGENT TYPES
// ============================================================================

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  type: 'text' | 'alert' | 'success';
  relatedDocId?: string;
}

export interface AgentState {
  memory: AgentMemory;
  skills: string[]; // Array of loaded skill IDs
  subAgents: string[]; // Array of active sub-agent IDs
  sessionHistory: any[];
  lastActive: string;
  status: 'idle' | 'processing' | 'waiting_human';
  messages?: AgentMessage[]; // Optional global history
  activityLog?: AgentActivity[]; // Optional global activity history
}

export interface AgentMemory {
  shortTerm: {
    currentThoughtProcess: string;
    pendingDecisions: any[];
    activeContext: Record<string, any>;
    conversationBuffer: AgentMessage[];
    stickyNoteBuffer: Record<string, string[]>; // Shared buffer for inter-agent tips
  };
  knowledgeGraph: {
    facts: KnowledgeFact[];
    relationships: KnowledgeRelationship[];
    version: number;
  };
}

export interface KnowledgeFact {
  id: string;
  type: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  source: string;
  timestamp: string;
}

export interface KnowledgeRelationship {
  id: string;
  fromFactId: string;
  toFactId: string;
  relationshipType: string;
  confidence: number;
}

export interface AgentEventPayload {
  documentId?: string;
  analysis?: Record<string, unknown>;
  extractedFacts?: KnowledgeFact[];
  product?: string;
  hsCode?: string;
  isOrganic?: boolean;
  attributes?: any;
  shipment?: {
    origin?: string;
    destination?: string;
    product?: string;
    hsCode?: string;
    attributes?: any;
  };
  roadmap?: Record<string, unknown>;
  message?: string;
  newOrigin?: string;
  newDestination?: string;
  [key: string]: any;
}

export interface AgentEvent {
  id: string; // UID for event tracking
  type: 'DOCUMENT_UPLOAD' | 'HUMAN_DECISION' | 'ROUTE_UPDATE' | 'USER_MESSAGE' | 'IOT_UPDATE';
  payload: AgentEventPayload;
  timestamp?: string;
}

export interface AgentActivity {
  agentId: string;
  agentName: string;
  status: 'success' | 'error';
  summary: string;
  timestamp: string;
  documentId?: string; // Optional: Link to a specific document in the roadmap
  // Extended fields for detailed UI
  skillsUsed?: string[];
  documentsIdentified?: string[];
  alerts?: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

export interface RequiredDocument {
    name: string;
    description?: string;
    category?: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other';
    agency?: string;
    agencyLink?: string;
    reason?: string;
}

export interface AgentEventResult {
  success: boolean;
  response: string;
  alerts: AgentAlert[];
  memoryUpdates?: Partial<AgentMemory>;
  activityLog?: AgentActivity[];
  requiredDocuments?: RequiredDocument[];
  data?: Record<string, any>;
}

export interface AgentAlert {
  id?: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedFactIds?: string[];
  suggestedAction?: string;
  actions?: AgentAction[];
  confidence?: number; // 0.0 to 1.0 - AI's certainty
}

export interface RLHFReviewCase {
  id: string; // Document ID in review_queue
  consignmentId: string;
  docType: string;
  fileUrl?: string;
  reason: string;
  details: string;
  aiAnalysis: any; // Raw analysis snapshot
  aiConfidence: number;
  severity: 'warning' | 'critical';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  humanReview?: {
    decision: 'approved' | 'rejected';
    softLabel: number; // 0-100%
    reasoning: string;
    reviewer: string;
    reviewedAt: string;
  };
}

export interface AgentAction {
  id: string;
  label: string;
  actionType: 'HEAL_ROUTE_MISMATCH' | 'REQUEST_DOCUMENT' | 'TRIGGER_AUDIT' | 'RESOLVE_CONFLICT';
  payload: any;
}
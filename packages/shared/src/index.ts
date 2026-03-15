// === API Response Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'error';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; message?: string }>;
  details?: Record<string, { status: string; message?: string }>;
}

// === User & Auth Types ===

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
  departmentName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  departmentId?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: UserResponse;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
}

// === Survey & Project Types ===

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export interface ProjectResponse {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  ownerName: string;
  surveyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdById: string;
  createdByName: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

// === Question Types ===

export enum QuestionType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  LINEAR_SCALE = 'linear_scale',
  DATE = 'date',
  FILE_UPLOAD = 'file_upload',
  MATRIX = 'matrix',
  RANKING = 'ranking',
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface LinearScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step: number;
}

export interface MatrixConfig {
  rows: QuestionOption[];
  columns: QuestionOption[];
  allowMultiple: boolean;
}

export interface FileUploadConfig {
  maxFileSize: number;
  maxFileCount: number;
  allowedTypes: string[];
}

export interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  minSelect?: number;
  maxSelect?: number;
  pattern?: string;
  customMessage?: string;
}

export interface QuestionOptions {
  choices?: QuestionOption[];
  linearScale?: LinearScaleConfig;
  matrix?: MatrixConfig;
  fileUpload?: FileUploadConfig;
  placeholder?: string;
  maxRows?: number;
}

export interface QuestionResponse {
  id: string;
  surveyId: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  options: QuestionOptions;
  validation: ValidationRule;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderQuestionsRequest {
  questionOrders: Array<{ id: string; order: number }>;
}

// === Distribution Types ===

export enum DistributionChannel {
  LINK = 'link',
  QR = 'qr',
  EMAIL = 'email',
}

export interface DistributionConfig {
  allowDuplicate: boolean;
  maxResponses: number | null;
  welcomeMessage: string | null;
  completionMessage: string | null;
}

export interface DistributionResponse {
  id: string;
  surveyId: string;
  channel: DistributionChannel;
  token: string;
  config: DistributionConfig;
  isActive: boolean;
  expiresAt: string | null;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDistributionRequest {
  channel?: DistributionChannel;
  config?: Partial<DistributionConfig>;
  expiresAt?: string;
}

export interface UpdateDistributionRequest {
  config?: Partial<DistributionConfig>;
  isActive?: boolean;
  expiresAt?: string | null;
}

// === Response Types ===

export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface AnswerValue {
  questionId: string;
  value: string | string[] | number | Record<string, string> | null;
}

export interface RespondentInfo {
  ipAddress: string;
  userAgent: string;
}

export interface SubmitResponseRequest {
  answers: AnswerValue[];
}

export interface SurveyResponseDetail {
  id: string;
  surveyId: string;
  distributionId: string | null;
  status: ResponseStatus;
  answers: AnswerValue[];
  respondentInfo: RespondentInfo;
  submittedAt: string | null;
  createdAt: string;
}

export interface PublicSurveyData {
  survey: {
    id: string;
    title: string;
    description: string | null;
  };
  questions: QuestionResponse[];
  config: DistributionConfig;
}

// === Report Types ===

export enum ChartType {
  BAR = 'bar',
  PIE = 'pie',
  LINE = 'line',
  HEATMAP = 'heatmap',
  STACKED_BAR = 'stacked-bar',
}

export interface ChoiceAggregation {
  type: 'choice';
  options: { label: string; count: number; percentage: number }[];
}

export interface TextAggregation {
  type: 'text';
  responses: string[];
  totalCount: number;
}

export interface NumericAggregation {
  type: 'numeric';
  average: number;
  median: number;
  min: number;
  max: number;
  distribution: { value: number; count: number }[];
}

export interface MatrixAggregation {
  type: 'matrix';
  rows: {
    label: string;
    columns: { label: string; count: number; percentage: number }[];
  }[];
}

export interface RankingAggregation {
  type: 'ranking';
  items: { label: string; averageRank: number; rankDistribution: number[] }[];
}

export type AggregationData =
  | ChoiceAggregation
  | TextAggregation
  | NumericAggregation
  | MatrixAggregation
  | RankingAggregation;

export interface QuestionAggregation {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  totalResponses: number;
  data: AggregationData;
}

export interface SurveyReportResponse {
  surveyId: string;
  surveyTitle: string;
  totalResponses: number;
  aggregations: QuestionAggregation[];
}

// === Template Types ===

export enum TemplateCategory {
  EMPLOYEE_SATISFACTION = 'employee_satisfaction',
  CUSTOMER_FEEDBACK = 'customer_feedback',
  EVENT_FEEDBACK = 'event_feedback',
  EDUCATION = 'education',
  GENERAL = 'general',
}

export interface TemplateQuestion {
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  options: QuestionOptions;
  validation: ValidationRule;
}

export interface TemplateResponse {
  id: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  questions: TemplateQuestion[];
  questionCount: number;
  usageCount: number;
  isSystem: boolean;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface CreateTemplateRequest {
  title: string;
  description?: string;
  category: TemplateCategory;
  surveyId?: string;
  questions?: TemplateQuestion[];
}

export interface UseTemplateRequest {
  projectId: string;
  title?: string;
}

// === App Constants ===

export const APP_CONSTANTS = {
  APP_NAME: 'Survey Platform',
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_SURVEY_TITLE_LENGTH: 200,
  MAX_QUESTION_TEXT_LENGTH: 1000,
} as const;

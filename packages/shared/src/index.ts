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

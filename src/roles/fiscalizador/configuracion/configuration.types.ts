export interface SystemConfiguration {
  id: string;
  key: string;

  systemName: string;
  supportEmail: string;

  defaultDueDays: number;

  realtimeEnabled: boolean;
  notificationsEnabled: boolean;

  aiAutoAnalysis: boolean;
  aiMinConfidence: number;

  updatedBy?: string;
  updatedAt: string;
}

export interface SystemConfigurationForm {
  systemName: string;
  supportEmail: string;

  defaultDueDays: number;

  realtimeEnabled: boolean;
  notificationsEnabled: boolean;

  aiAutoAnalysis: boolean;
  aiMinConfidence: number;
}

export interface SystemConfigurationValue {
  systemName?: unknown;
  supportEmail?: unknown;

  defaultDueDays?: unknown;

  realtimeEnabled?: unknown;
  notificationsEnabled?: unknown;

  aiAutoAnalysis?: unknown;
  aiMinConfidence?: unknown;
}

export interface SystemConfigurationRow {
  id: string;
  key: string;

  value: SystemConfigurationValue;

  updated_by: string | null;
  updated_at: string;
}export interface SystemConfiguration {
  id: string;
  key: string;

  systemName: string;
  supportEmail: string;

  defaultDueDays: number;

  realtimeEnabled: boolean;
  notificationsEnabled: boolean;

  aiAutoAnalysis: boolean;
  aiMinConfidence: number;

  updatedBy?: string;
  updatedAt: string;
}

export interface SystemConfigurationForm {
  systemName: string;
  supportEmail: string;

  defaultDueDays: number;

  realtimeEnabled: boolean;
  notificationsEnabled: boolean;

  aiAutoAnalysis: boolean;
  aiMinConfidence: number;
}

export interface SystemConfigurationValue {
  systemName?: unknown;
  supportEmail?: unknown;

  defaultDueDays?: unknown;

  realtimeEnabled?: unknown;
  notificationsEnabled?: unknown;

  aiAutoAnalysis?: unknown;
  aiMinConfidence?: unknown;
}

export interface SystemConfigurationRow {
  id: string;
  key: string;

  value: SystemConfigurationValue;

  updated_by: string | null;
  updated_at: string;
}
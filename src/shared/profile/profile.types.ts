export interface CurrentProfile {
  id: string;

  displayName: string;

  role?: string;
  companyId?: string;
}

export interface CurrentProfileRow {
  id: string;

  display_name: string | null;

  role: string | null;
  company_id: string | null;
}
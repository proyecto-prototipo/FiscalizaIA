export interface CompanyOperation {
  id: string;
  companyId: string;

  name: string;

  code?: string;
  status?: string;
  location?: string;
  operationType?: string;

  description?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface OperationCompany {
  id: string;

  name: string;

  documentNumber?: string;
  status?: string;
}

export interface OperationPageData {
  company: OperationCompany;

  operations: CompanyOperation[];

  totalOperations: number;

  activeOperations: number;
  inactiveOperations: number;

  lastUpdated: string;
}
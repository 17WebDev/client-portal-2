export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'client';
  createdAt: string;
  lastLogin: string | null;
}

export interface Client {
  id: number;
  userId: number;
  companyName: string;
  legalEntityName?: string;
  legalBusinessAddress?: string;
  signeeName?: string;
  signeeEmail?: string;
  signeePhone?: string;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  pipelineStage: 'qualifying_call' | 'discovery_call' | 'followup_call' | 'free_work_delivery' | 'final_presentation';
  createdAt: string;
  updatedAt: string;
  userInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface Project {
  id: number;
  clientId: number;
  name: string;
  description: string;
  goal?: string;
  budget?: string;
  timeline?: string;
  goLiveDate?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: number;
  projectId: number;
  senderId: number;
  recipientId: number;
  message: string;
  type: 'update' | 'question' | 'decision';
  createdAt: string;
  readAt: string | null;
  sender?: {
    id: number;
    name: string;
  };
  recipient?: {
    id: number;
    name: string;
  };
}

export interface Document {
  id: number;
  projectId?: number;
  clientId?: number;
  name: string;
  type: 'contract' | 'invoice' | 'deliverable';
  status: 'draft' | 'sent' | 'signed' | 'paid';
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingData {
  id: number;
  clientId: number;
  phase: 'basic_info' | 'project_details' | 'company_profile';
  data: Record<string, any>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientOnboardingStatus {
  status: 'pending' | 'in_progress' | 'completed';
  phases: OnboardingData[];
}

export interface PipelineStageData {
  stage: string;
  count: number;
  clients: { id: number; companyName: string; }[];
}

export interface ProjectAnalytics {
  totalProjects: number;
  projectsByStatus: {
    completed: number;
    inProgress: number;
    planning: number;
    onHold: number;
  };
  completionRate: number;
  avgCompletionDays: number;
}

export interface ClientFormData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isSignee: boolean;
}

export interface ProjectDetailsFormData {
  projectGoal: string;
  businessImpact: string;
  successCriteria: string;
  budget: string;
  timeline: string;
  goLiveDate: string;
  references: string;
}

export interface CompanyProfileFormData {
  legalEntityName: string;
  legalBusinessAddress: string;
  signeeName: string;
  signeeEmail: string;
  signeePhone: string;
}

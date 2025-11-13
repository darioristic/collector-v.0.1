export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  source: string | null;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName?: string;
  interviewerId: string | null;
  interviewerName?: string | null;
  scheduledAt: string;
  type: "phone" | "video" | "onsite" | "technical" | "hr";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidatesListResponse {
  data: Candidate[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface InterviewsListResponse {
  data: Interview[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CandidatesQueryState {
  status?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  position?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InterviewsQueryState {
  candidateId?: string;
  interviewerId?: string;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  limit?: number;
  offset?: number;
}


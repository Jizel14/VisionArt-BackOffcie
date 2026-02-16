export type ReportType = "artwork" | "bug" | "user" | "other";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export interface ReportUser {
  id: string;
  name: string;
  email: string;
}

export interface Report {
  id: string;
  type: ReportType;
  targetId: string | null;
  subject: string;
  description: string;
  imageUrl: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReportUser | null;
}

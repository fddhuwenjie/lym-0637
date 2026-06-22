export type UserRole = 'hr' | 'employee';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  positionId: string | null;
  avatar: string;
}

export interface Position {
  id: string;
  name: string;
  description: string;
  maxRetakeCount: number;
  requiredCourseIds: string[];
  requiredCertificateCourseIds: string[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  content: string;
  credit: number;
  passingScore: number;
  questionCount: number;
  certificateValidDays: number;
  reminderDays: number;
  createdAt: string;
}

export type QuestionType = 'single' | 'multiple' | 'judge';

export interface Question {
  id: string;
  courseId: string;
  type: QuestionType;
  content: string;
  options: string[];
  correctAnswers: number[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface ExamAnswer {
  questionId: string;
  selectedAnswers: number[];
}

export interface ExamAttempt {
  id: string;
  userId: string;
  courseId: string;
  questionVersion: number;
  questionIds: string[];
  answers: ExamAnswer[];
  score: number;
  passed: boolean;
  attemptNumber: number;
  submitted: boolean;
  startedAt: string;
  submittedAt: string | null;
}

export type CertificateStatus = 'valid' | 'expiring' | 'expired';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  examAttemptId: string;
  issuedAt: string;
  expiresAt: string;
  status: CertificateStatus;
  version: number;
}

export type ReminderType = 'expiring_30d' | 'expiring_7d' | 'expired';

export interface Reminder {
  id: string;
  userId: string;
  certificateId: string;
  type: ReminderType;
  sentAt: string;
  acknowledged: boolean;
}

export interface ExportHistory {
  id: string;
  type: string;
  filename: string;
  createdAt: string;
  createdBy: string;
}

export interface ComplianceRecord {
  userId: string;
  userName: string;
  positionId: string | null;
  positionName: string | null;
  isPositionCompliant: boolean;
  missingCourses: { courseId: string; courseName: string }[];
  expiredCertificates: { courseId: string; courseName: string; expiresAt: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

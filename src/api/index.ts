import { apiClient } from './client'
import type {
  User,
  Course,
  Question,
  Position,
  Enrollment,
  ExamAttempt,
  ExamAnswer,
  Certificate,
  Reminder,
  ExportHistory,
  ComplianceRecord,
} from '../../shared/types'

export const authApi = {
  login: (name: string) =>
    apiClient.post<{ user: User }>('/auth/login', { name }),
  logout: () => apiClient.post<void>('/auth/logout'),
}

export const userApi = {
  getUsers: () => apiClient.get<User[]>('/users'),
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
}

export const courseApi = {
  getCourses: () => apiClient.get<Course[]>('/courses'),
  createCourse: (data: Omit<Course, 'id' | 'createdAt'>) =>
    apiClient.post<Course>('/courses', data),
  updateCourse: (id: string, data: Partial<Omit<Course, 'id'>>) =>
    apiClient.put<Course>(`/courses/${id}`, data),
  deleteCourse: (id: string) => apiClient.delete<void>(`/courses/${id}`),
}

export const questionApi = {
  getQuestions: (courseId?: string) =>
    apiClient.get<Question[]>('/questions', courseId ? { courseId } : undefined),
  createQuestion: (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Question>('/questions', data),
  updateQuestion: (id: string, data: Partial<Omit<Question, 'id'>>) =>
    apiClient.put<Question>(`/questions/${id}`, data),
  deleteQuestion: (id: string) => apiClient.delete<void>(`/questions/${id}`),
}

export const positionApi = {
  getPositions: () => apiClient.get<Position[]>('/positions'),
  createPosition: (data: Omit<Position, 'id'>) =>
    apiClient.post<Position>('/positions', data),
  updatePosition: (id: string, data: Partial<Omit<Position, 'id'>>) =>
    apiClient.put<Position>(`/positions/${id}`, data),
  deletePosition: (id: string) => apiClient.delete<void>(`/positions/${id}`),
}

export const enrollmentApi = {
  getEnrollments: (userId?: string) =>
    apiClient.get<Enrollment[]>('/enrollments', userId ? { userId } : undefined),
  enrollCourse: (userId: string, courseId: string) =>
    apiClient.post<Enrollment>('/enrollments', { userId, courseId }),
  updateProgress: (id: string, progress: number) =>
    apiClient.put<Enrollment>(`/enrollments/${id}`, { progress }),
}

export const examApi = {
  getExams: (userId?: string) =>
    apiClient.get<ExamAttempt[]>('/exams', userId ? { userId } : undefined),
  startExam: (courseId: string) =>
    apiClient.post<ExamAttempt>('/exams/start', { courseId }),
  submitExam: (id: string, answers: ExamAnswer[]) =>
    apiClient.post<ExamAttempt>(`/exams/${id}/submit`, { answers }),
}

export const certificateApi = {
  getCertificates: (userId?: string) =>
    apiClient.get<Certificate[]>('/certificates', userId ? { userId } : undefined),
  renewCertificate: (certificateId: string) =>
    apiClient.post<Certificate>(`/certificates/${certificateId}/renew`),
}

export const reminderApi = {
  getReminders: (userId?: string) =>
    apiClient.get<Reminder[]>('/reminders', userId ? { userId } : undefined),
}

export const complianceApi = {
  getCompliance: () => apiClient.get<ComplianceRecord[]>('/compliance'),
}

export const exportApi = {
  exportData: (type: string, filters?: Record<string, unknown>) =>
    apiClient.post<{ url: string; filename: string }>('/export', { type, filters }),
  getExportHistory: () => apiClient.get<ExportHistory[]>('/export/history'),
}

export * from './client'

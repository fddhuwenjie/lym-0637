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
  InterventionRule,
  PositionCertConfig,
  InterventionTask,
  ReviewRecord,
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
  downloadExport: (type: string, createdBy?: string) => {
    const query = createdBy ? `?type=${type}&createdBy=${createdBy}` : `?type=${type}`
    window.open(`/api/export${query}`, '_blank')
  },
}

export const interventionRuleApi = {
  getRules: () => apiClient.get<InterventionRule[]>('/intervention-rules'),
  createRule: (data: Omit<InterventionRule, 'id'>) =>
    apiClient.post<InterventionRule>('/intervention-rules', data),
  updateRule: (id: string, data: Partial<Omit<InterventionRule, 'id'>>) =>
    apiClient.put<InterventionRule>(`/intervention-rules/${id}`, data),
  deleteRule: (id: string) =>
    apiClient.delete<void>(`/intervention-rules/${id}`),
}

export const positionCertConfigApi = {
  getConfigs: () => apiClient.get<PositionCertConfig[]>('/position-cert-configs'),
  getConfigByPosition: (positionId: string) =>
    apiClient.get<PositionCertConfig>(`/position-cert-configs/${positionId}`),
  createConfig: (data: Omit<PositionCertConfig, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<PositionCertConfig>('/position-cert-configs', data),
  updateConfig: (id: string, data: Partial<Omit<PositionCertConfig, 'id' | 'createdAt'>>) =>
    apiClient.put<PositionCertConfig>(`/position-cert-configs/${id}`, data),
  deleteConfig: (id: string) =>
    apiClient.delete<void>(`/position-cert-configs/${id}`),
}

export const interventionTaskApi = {
  getTasks: (params?: {
    userId?: string
    positionId?: string
    status?: string
    triggerType?: string
  }) => apiClient.get<InterventionTask[]>('/intervention-tasks', params),
  getTask: (id: string) => apiClient.get<InterventionTask>(`/intervention-tasks/${id}`),
  detectAndGenerate: (params?: { positionId?: string; userId?: string }) =>
    apiClient.post<{ generatedCount: number; tasks: InterventionTask[] }>(
      '/intervention-tasks/detect',
      params || {}
    ),
  createTask: (data: Partial<InterventionTask> & {
    userId: string
    triggerType: any
    triggerDescription: string
    actions: any[]
    priority: number
  }) => apiClient.post<InterventionTask>('/intervention-tasks', data),
  updateTask: (id: string, data: any) =>
    apiClient.put<InterventionTask>(`/intervention-tasks/${id}`, data),
  deleteTask: (id: string) =>
    apiClient.delete<void>(`/intervention-tasks/${id}`),
}

export const reviewRecordApi = {
  getRecords: (params?: {
    userId?: string
    positionId?: string
    reviewerId?: string
    result?: string
    taskId?: string
  }) => apiClient.get<ReviewRecord[]>('/review-records', params),
  getRecord: (id: string) => apiClient.get<ReviewRecord>(`/review-records/${id}`),
  createRecord: (data: Omit<ReviewRecord, 'id' | 'createdAt'>) =>
    apiClient.post<ReviewRecord>('/review-records', data),
  updateRecord: (id: string, data: Partial<Omit<ReviewRecord, 'id' | 'createdAt'>>) =>
    apiClient.put<ReviewRecord>(`/review-records/${id}`, data),
}

export * from './client'

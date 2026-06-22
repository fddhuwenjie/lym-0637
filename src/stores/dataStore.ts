import { create } from 'zustand'
import type {
  User,
  Course,
  Question,
  Position,
  Enrollment,
  ExamAttempt,
  Certificate,
  Reminder,
  ExportHistory,
  ComplianceRecord,
  InterventionRule,
  PositionCertConfig,
  InterventionTask,
  ReviewRecord,
} from '../../shared/types'
import {
  userApi,
  courseApi,
  questionApi,
  positionApi,
  enrollmentApi,
  examApi,
  certificateApi,
  reminderApi,
  complianceApi,
  exportApi,
  interventionRuleApi,
  positionCertConfigApi,
  interventionTaskApi,
  reviewRecordApi,
} from '../api'

interface DataState {
  users: User[]
  courses: Course[]
  questions: Question[]
  positions: Position[]
  enrollments: Enrollment[]
  exams: ExamAttempt[]
  certificates: Certificate[]
  reminders: Reminder[]
  compliance: ComplianceRecord[]
  exportHistory: ExportHistory[]
  interventionRules: InterventionRule[]
  positionCertConfigs: PositionCertConfig[]
  interventionTasks: InterventionTask[]
  reviewRecords: ReviewRecord[]

  loading: Record<string, boolean>
  errors: Record<string, string | null>

  loadUsers: () => Promise<void>
  loadCourses: () => Promise<void>
  loadQuestions: (courseId?: string) => Promise<void>
  loadPositions: () => Promise<void>
  loadEnrollments: (userId?: string) => Promise<void>
  loadExams: (userId?: string) => Promise<void>
  loadCertificates: (userId?: string) => Promise<void>
  loadReminders: (userId?: string) => Promise<void>
  loadCompliance: () => Promise<void>
  loadExportHistory: () => Promise<void>
  loadInterventionRules: () => Promise<void>
  loadPositionCertConfigs: () => Promise<void>
  loadInterventionTasks: (params?: {
    userId?: string
    positionId?: string
    status?: string
    triggerType?: string
  }) => Promise<void>
  loadReviewRecords: (params?: {
    userId?: string
    positionId?: string
    reviewerId?: string
    result?: string
    taskId?: string
  }) => Promise<void>
  loadAll: () => Promise<void>

  setUsers: (users: User[]) => void
  setCourses: (courses: Course[]) => void
  setQuestions: (questions: Question[]) => void
  setPositions: (positions: Position[]) => void
  setEnrollments: (enrollments: Enrollment[]) => void
  setExams: (exams: ExamAttempt[]) => void
  setCertificates: (certificates: Certificate[]) => void
  setReminders: (reminders: Reminder[]) => void
}

const initialLoading: Record<string, boolean> = {
  users: false,
  courses: false,
  questions: false,
  positions: false,
  enrollments: false,
  exams: false,
  certificates: false,
  reminders: false,
  compliance: false,
  exportHistory: false,
  interventionRules: false,
  positionCertConfigs: false,
  interventionTasks: false,
  reviewRecords: false,
}

const initialErrors: Record<string, string | null> = {
  users: null,
  courses: null,
  questions: null,
  positions: null,
  enrollments: null,
  exams: null,
  certificates: null,
  reminders: null,
  compliance: null,
  exportHistory: null,
  interventionRules: null,
  positionCertConfigs: null,
  interventionTasks: null,
  reviewRecords: null,
}

export const useDataStore = create<DataState>((set, get) => ({
  users: [],
  courses: [],
  questions: [],
  positions: [],
  enrollments: [],
  exams: [],
  certificates: [],
  reminders: [],
  compliance: [],
  exportHistory: [],
  interventionRules: [],
  positionCertConfigs: [],
  interventionTasks: [],
  reviewRecords: [],
  loading: { ...initialLoading },
  errors: { ...initialErrors },

  loadUsers: async () => {
    set((state) => ({
      loading: { ...state.loading, users: true },
      errors: { ...state.errors, users: null },
    }))
    const response = await userApi.getUsers()
    if (response.success && response.data) {
      set((state) => ({
        users: response.data!,
        loading: { ...state.loading, users: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, users: response.error || 'Failed to load users' },
        loading: { ...state.loading, users: false },
      }))
    }
  },

  loadCourses: async () => {
    set((state) => ({
      loading: { ...state.loading, courses: true },
      errors: { ...state.errors, courses: null },
    }))
    const response = await courseApi.getCourses()
    if (response.success && response.data) {
      set((state) => ({
        courses: response.data!,
        loading: { ...state.loading, courses: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, courses: response.error || 'Failed to load courses' },
        loading: { ...state.loading, courses: false },
      }))
    }
  },

  loadQuestions: async (courseId?: string) => {
    set((state) => ({
      loading: { ...state.loading, questions: true },
      errors: { ...state.errors, questions: null },
    }))
    const response = await questionApi.getQuestions(courseId)
    if (response.success && response.data) {
      set((state) => ({
        questions: response.data!,
        loading: { ...state.loading, questions: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, questions: response.error || 'Failed to load questions' },
        loading: { ...state.loading, questions: false },
      }))
    }
  },

  loadPositions: async () => {
    set((state) => ({
      loading: { ...state.loading, positions: true },
      errors: { ...state.errors, positions: null },
    }))
    const response = await positionApi.getPositions()
    if (response.success && response.data) {
      set((state) => ({
        positions: response.data!,
        loading: { ...state.loading, positions: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, positions: response.error || 'Failed to load positions' },
        loading: { ...state.loading, positions: false },
      }))
    }
  },

  loadEnrollments: async (userId?: string) => {
    set((state) => ({
      loading: { ...state.loading, enrollments: true },
      errors: { ...state.errors, enrollments: null },
    }))
    const response = await enrollmentApi.getEnrollments(userId)
    if (response.success && response.data) {
      set((state) => ({
        enrollments: response.data!,
        loading: { ...state.loading, enrollments: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, enrollments: response.error || 'Failed to load enrollments' },
        loading: { ...state.loading, enrollments: false },
      }))
    }
  },

  loadExams: async (userId?: string) => {
    set((state) => ({
      loading: { ...state.loading, exams: true },
      errors: { ...state.errors, exams: null },
    }))
    const response = await examApi.getExams(userId)
    if (response.success && response.data) {
      set((state) => ({
        exams: response.data!,
        loading: { ...state.loading, exams: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, exams: response.error || 'Failed to load exams' },
        loading: { ...state.loading, exams: false },
      }))
    }
  },

  loadCertificates: async (userId?: string) => {
    set((state) => ({
      loading: { ...state.loading, certificates: true },
      errors: { ...state.errors, certificates: null },
    }))
    const response = await certificateApi.getCertificates(userId)
    if (response.success && response.data) {
      set((state) => ({
        certificates: response.data!,
        loading: { ...state.loading, certificates: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, certificates: response.error || 'Failed to load certificates' },
        loading: { ...state.loading, certificates: false },
      }))
    }
  },

  loadReminders: async (userId?: string) => {
    set((state) => ({
      loading: { ...state.loading, reminders: true },
      errors: { ...state.errors, reminders: null },
    }))
    const response = await reminderApi.getReminders(userId)
    if (response.success && response.data) {
      set((state) => ({
        reminders: response.data!,
        loading: { ...state.loading, reminders: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, reminders: response.error || 'Failed to load reminders' },
        loading: { ...state.loading, reminders: false },
      }))
    }
  },

  loadCompliance: async () => {
    set((state) => ({
      loading: { ...state.loading, compliance: true },
      errors: { ...state.errors, compliance: null },
    }))
    const response = await complianceApi.getCompliance()
    if (response.success && response.data) {
      set((state) => ({
        compliance: response.data!,
        loading: { ...state.loading, compliance: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, compliance: response.error || 'Failed to load compliance' },
        loading: { ...state.loading, compliance: false },
      }))
    }
  },

  loadExportHistory: async () => {
    set((state) => ({
      loading: { ...state.loading, exportHistory: true },
      errors: { ...state.errors, exportHistory: null },
    }))
    const response = await exportApi.getExportHistory()
    if (response.success && response.data) {
      set((state) => ({
        exportHistory: response.data!,
        loading: { ...state.loading, exportHistory: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, exportHistory: response.error || 'Failed to load export history' },
        loading: { ...state.loading, exportHistory: false },
      }))
    }
  },

  loadInterventionRules: async () => {
    set((state) => ({
      loading: { ...state.loading, interventionRules: true },
      errors: { ...state.errors, interventionRules: null },
    }))
    const response = await interventionRuleApi.getRules()
    if (response.success && response.data) {
      set((state) => ({
        interventionRules: response.data!,
        loading: { ...state.loading, interventionRules: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, interventionRules: response.error || 'Failed to load intervention rules' },
        loading: { ...state.loading, interventionRules: false },
      }))
    }
  },

  loadPositionCertConfigs: async () => {
    set((state) => ({
      loading: { ...state.loading, positionCertConfigs: true },
      errors: { ...state.errors, positionCertConfigs: null },
    }))
    const response = await positionCertConfigApi.getConfigs()
    if (response.success && response.data) {
      set((state) => ({
        positionCertConfigs: response.data!,
        loading: { ...state.loading, positionCertConfigs: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, positionCertConfigs: response.error || 'Failed to load position cert configs' },
        loading: { ...state.loading, positionCertConfigs: false },
      }))
    }
  },

  loadInterventionTasks: async (params) => {
    set((state) => ({
      loading: { ...state.loading, interventionTasks: true },
      errors: { ...state.errors, interventionTasks: null },
    }))
    const response = await interventionTaskApi.getTasks(params)
    if (response.success && response.data) {
      set((state) => ({
        interventionTasks: response.data!,
        loading: { ...state.loading, interventionTasks: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, interventionTasks: response.error || 'Failed to load intervention tasks' },
        loading: { ...state.loading, interventionTasks: false },
      }))
    }
  },

  loadReviewRecords: async (params) => {
    set((state) => ({
      loading: { ...state.loading, reviewRecords: true },
      errors: { ...state.errors, reviewRecords: null },
    }))
    const response = await reviewRecordApi.getRecords(params)
    if (response.success && response.data) {
      set((state) => ({
        reviewRecords: response.data!,
        loading: { ...state.loading, reviewRecords: false },
      }))
    } else {
      set((state) => ({
        errors: { ...state.errors, reviewRecords: response.error || 'Failed to load review records' },
        loading: { ...state.loading, reviewRecords: false },
      }))
    }
  },

  loadAll: async () => {
    await Promise.all([
      get().loadUsers(),
      get().loadCourses(),
      get().loadPositions(),
      get().loadCompliance(),
      get().loadExportHistory(),
      get().loadInterventionRules(),
      get().loadPositionCertConfigs(),
      get().loadInterventionTasks(),
      get().loadReviewRecords(),
    ])
  },

  setUsers: (users: User[]) => set({ users }),
  setCourses: (courses: Course[]) => set({ courses }),
  setQuestions: (questions: Question[]) => set({ questions }),
  setPositions: (positions: Position[]) => set({ positions }),
  setEnrollments: (enrollments: Enrollment[]) => set({ enrollments }),
  setExams: (exams: ExamAttempt[]) => set({ exams }),
  setCertificates: (certificates: Certificate[]) => set({ certificates }),
  setReminders: (reminders: Reminder[]) => set({ reminders }),
}))

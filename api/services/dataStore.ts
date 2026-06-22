import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User, Position, Course, Question, Enrollment, ExamAttempt,
  Certificate, Reminder, ExportHistory,
  InterventionRule, PositionCertConfig, InterventionTask, ReviewRecord
} from '../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

export interface DataSchema {
  users: User[];
  positions: Position[];
  courses: Course[];
  questions: Question[];
  enrollments: Enrollment[];
  examAttempts: ExamAttempt[];
  certificates: Certificate[];
  reminders: Reminder[];
  exportHistory: ExportHistory[];
  interventionRules: InterventionRule[];
  positionCertConfigs: PositionCertConfig[];
  interventionTasks: InterventionTask[];
  reviewRecords: ReviewRecord[];
}

const FILES: (keyof DataSchema)[] = [
  'users', 'positions', 'courses', 'questions', 'enrollments',
  'examAttempts', 'certificates', 'reminders', 'exportHistory',
  'interventionRules', 'positionCertConfigs', 'interventionTasks', 'reviewRecords'
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultData(): DataSchema {
  const now = new Date().toISOString();
  const past = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

  return {
    users: [
      { id: 'u_hr1', name: '张经理', role: 'hr', positionId: null, avatar: '👨‍💼' },
      { id: 'u_e1', name: '李明', role: 'employee', positionId: 'pos_1', avatar: '👨‍💻' },
      { id: 'u_e2', name: '王芳', role: 'employee', positionId: 'pos_2', avatar: '👩‍💻' },
      { id: 'u_e3', name: '陈伟', role: 'employee', positionId: 'pos_1', avatar: '🧑‍💻' },
    ],
    positions: [
      {
        id: 'pos_1', name: '安全工程师', description: '负责生产安全管理',
        maxRetakeCount: 2,
        requiredCourseIds: ['c_safety', 'c_fire'],
        requiredCertificateCourseIds: ['c_safety', 'c_fire'],
      },
      {
        id: 'pos_2', name: '质量管理员', description: '负责产品质量控制',
        maxRetakeCount: 3,
        requiredCourseIds: ['c_quality', 'c_safety'],
        requiredCertificateCourseIds: ['c_quality'],
      },
    ],
    courses: [
      {
        id: 'c_safety', name: '安全生产基础',
        description: '企业安全生产基础知识培训',
        content: '第一章：安全生产概述\n第二章：安全生产法律法规\n第三章：事故预防与应急处理\n第四章：职业健康与防护',
        credit: 4, passingScore: 60, questionCount: 5,
        certificateValidDays: 365, reminderDays: 30,
        createdAt: past(60),
      },
      {
        id: 'c_fire', name: '消防安全培训',
        description: '消防知识与应急演练',
        content: '第一章：火灾预防\n第二章：灭火器材使用\n第三章：逃生与自救\n第四章：消防法规',
        credit: 3, passingScore: 70, questionCount: 5,
        certificateValidDays: 365, reminderDays: 30,
        createdAt: past(60),
      },
      {
        id: 'c_quality', name: '质量管理体系',
        description: 'ISO质量管理体系基础',
        content: '第一章：质量管理概述\n第二章：ISO9001标准解读\n第三章：质量控制工具\n第四章：持续改进',
        credit: 5, passingScore: 60, questionCount: 5,
        certificateValidDays: 730, reminderDays: 60,
        createdAt: past(60),
      },
    ],
    questions: [
      { id: 'q1', courseId: 'c_safety', type: 'single', content: '安全生产的方针是什么？',
        options: ['安全第一、预防为主', '生产第一、安全为辅', '效益优先', '质量第一'],
        correctAnswers: [0], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q2', courseId: 'c_safety', type: 'multiple', content: '以下哪些属于个人防护用品？',
        options: ['安全帽', '安全带', '手机', '护目镜'],
        correctAnswers: [0, 1, 3], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q3', courseId: 'c_safety', type: 'judge', content: '发现安全隐患应立即报告。',
        options: ['正确', '错误'],
        correctAnswers: [0], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q4', courseId: 'c_safety', type: 'single', content: '事故处理的"四不放过"原则不包括？',
        options: ['原因未查清不放过', '责任人未处理不放过', '整改措施未落实不放过', '损失未挽回不放过'],
        correctAnswers: [3], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q5', courseId: 'c_safety', type: 'single', content: '三级安全教育是指？',
        options: ['厂级、车间级、班组级', '国家级、省级、市级', '初级、中级、高级', '以上都不对'],
        correctAnswers: [0], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q6', courseId: 'c_fire', type: 'single', content: '电器着火应使用哪种灭火器？',
        options: ['水基型', '干粉', '泡沫', '任意类型'],
        correctAnswers: [1], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q7', courseId: 'c_fire', type: 'multiple', content: '火灾逃生的正确做法有？',
        options: ['用湿毛巾捂住口鼻', '乘坐电梯快速撤离', '弯腰低姿前行', '贪恋财物返回'],
        correctAnswers: [0, 2], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q8', courseId: 'c_fire', type: 'judge', content: '发现火灾应先尝试扑救，不行再报警。',
        options: ['正确', '错误'],
        correctAnswers: [1], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q9', courseId: 'c_fire', type: 'single', content: '灭火器压力表指针在哪个区域表示正常？',
        options: ['红色区', '黄色区', '绿色区', '黑色区'],
        correctAnswers: [2], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q10', courseId: 'c_fire', type: 'single', content: '燃烧三要素不包括？',
        options: ['可燃物', '助燃物', '点火源', '氧气'],
        correctAnswers: [3], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q11', courseId: 'c_quality', type: 'single', content: 'ISO9001的最新版本是？',
        options: ['ISO9001:2000', 'ISO9001:2008', 'ISO9001:2015', 'ISO9001:2020'],
        correctAnswers: [2], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q12', courseId: 'c_quality', type: 'multiple', content: '质量管理七项原则包括？',
        options: ['以顾客为关注焦点', '领导作用', '全员参与', '经验主义'],
        correctAnswers: [0, 1, 2], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q13', courseId: 'c_quality', type: 'judge', content: 'PDCA循环是质量改进的基本方法。',
        options: ['正确', '错误'],
        correctAnswers: [0], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q14', courseId: 'c_quality', type: 'single', content: '以下哪个不是"5M1E"因素？',
        options: ['人(Man)', '机(Machine)', '料(Material)', '金钱(Money)'],
        correctAnswers: [3], version: 1, createdAt: past(60), updatedAt: past(60) },
      { id: 'q15', courseId: 'c_quality', type: 'single', content: 'QC七大手法不包括？',
        options: ['柏拉图', '鱼骨图', '直方图', '财务报表'],
        correctAnswers: [3], version: 1, createdAt: past(60), updatedAt: past(60) },
    ],
    enrollments: [
      { id: 'en1', userId: 'u_e1', courseId: 'c_safety', progress: 100, enrolledAt: past(40), completedAt: past(30) },
      { id: 'en2', userId: 'u_e1', courseId: 'c_fire', progress: 60, enrolledAt: past(20), completedAt: null },
      { id: 'en3', userId: 'u_e2', courseId: 'c_safety', progress: 100, enrolledAt: past(50), completedAt: past(45) },
      { id: 'en4', userId: 'u_e2', courseId: 'c_quality', progress: 100, enrolledAt: past(50), completedAt: past(40) },
      { id: 'en5', userId: 'u_e3', courseId: 'c_safety', progress: 30, enrolledAt: past(10), completedAt: null },
    ],
    examAttempts: [
      {
        id: 'ex1', userId: 'u_e1', courseId: 'c_safety', questionVersion: 1,
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
        answers: [
          { questionId: 'q1', selectedAnswers: [0] },
          { questionId: 'q2', selectedAnswers: [0, 1, 3] },
          { questionId: 'q3', selectedAnswers: [0] },
          { questionId: 'q4', selectedAnswers: [3] },
          { questionId: 'q5', selectedAnswers: [0] },
        ],
        score: 100, passed: true, attemptNumber: 1, submitted: true,
        startedAt: past(30), submittedAt: past(30),
      },
      {
        id: 'ex2', userId: 'u_e2', courseId: 'c_safety', questionVersion: 1,
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
        answers: [
          { questionId: 'q1', selectedAnswers: [0] },
          { questionId: 'q2', selectedAnswers: [0, 1, 3] },
          { questionId: 'q3', selectedAnswers: [0] },
          { questionId: 'q4', selectedAnswers: [0] },
          { questionId: 'q5', selectedAnswers: [0] },
        ],
        score: 80, passed: true, attemptNumber: 1, submitted: true,
        startedAt: past(45), submittedAt: past(45),
      },
      {
        id: 'ex3', userId: 'u_e2', courseId: 'c_quality', questionVersion: 1,
        questionIds: ['q11', 'q12', 'q13', 'q14', 'q15'],
        answers: [
          { questionId: 'q11', selectedAnswers: [2] },
          { questionId: 'q12', selectedAnswers: [0, 1, 2] },
          { questionId: 'q13', selectedAnswers: [0] },
          { questionId: 'q14', selectedAnswers: [3] },
          { questionId: 'q15', selectedAnswers: [3] },
        ],
        score: 100, passed: true, attemptNumber: 2, submitted: true,
        startedAt: past(40), submittedAt: past(40),
      },
    ],
    certificates: [
      {
        id: 'cert1', userId: 'u_e1', courseId: 'c_safety', examAttemptId: 'ex1',
        issuedAt: past(30), expiresAt: future(335), status: 'valid', version: 1,
      },
      {
        id: 'cert2', userId: 'u_e2', courseId: 'c_safety', examAttemptId: 'ex2',
        issuedAt: past(45), expiresAt: future(20), status: 'expiring', version: 1,
      },
      {
        id: 'cert3', userId: 'u_e2', courseId: 'c_quality', examAttemptId: 'ex3',
        issuedAt: past(40), expiresAt: past(10), status: 'expired', version: 1,
      },
    ],
    reminders: [
      {
        id: 'r1', userId: 'u_e2', certificateId: 'cert2', type: 'expiring_30d',
        sentAt: past(10), acknowledged: false,
      },
      {
        id: 'r2', userId: 'u_e2', certificateId: 'cert3', type: 'expired',
        sentAt: past(10), acknowledged: false,
      },
    ],
    exportHistory: [],
    interventionRules: [
      {
        id: 'rule1',
        triggerType: 'cert_expiring',
        triggerValue: 30,
        actions: ['notify', 'assign_course'],
        description: '证书到期前30天触发：通知员工并分配复习课程',
        enabled: true,
        priority: 1,
      },
      {
        id: 'rule2',
        triggerType: 'cert_expiring',
        triggerValue: 7,
        actions: ['notify', 'schedule_review', 'manual_review'],
        description: '证书到期前7天触发：紧急通知、安排复核并人工审核',
        enabled: true,
        priority: 2,
      },
      {
        id: 'rule3',
        triggerType: 'cert_expired',
        actions: ['notify', 'manual_review', 'assign_exam'],
        description: '证书过期触发：通知、人工审核并安排补考',
        enabled: true,
        priority: 3,
      },
      {
        id: 'rule4',
        triggerType: 'exam_fail_repeated',
        triggerValue: 2,
        actions: ['notify', 'assign_course', 'manual_review'],
        description: '连续2次考试未通过触发：通知、重新分配学习、人工审核',
        enabled: true,
        priority: 2,
      },
      {
        id: 'rule5',
        triggerType: 'required_course_gap',
        actions: ['notify', 'assign_course'],
        description: '岗位必修课程缺口触发：通知并分配课程',
        enabled: true,
        priority: 1,
      },
      {
        id: 'rule6',
        triggerType: 'required_cert_gap',
        actions: ['notify', 'assign_course', 'assign_exam'],
        description: '岗位必修证书缺口触发：通知、分配课程与考试',
        enabled: true,
        priority: 2,
      },
    ],
    positionCertConfigs: [
      {
        id: 'pcc1',
        positionId: 'pos_1',
        reviewCycleDays: 365,
        riskLevel: 'high',
        ruleIds: ['rule1', 'rule2', 'rule3', 'rule4', 'rule5', 'rule6'],
        assignedReviewerIds: ['u_hr1'],
        createdAt: past(60),
        updatedAt: past(60),
      },
      {
        id: 'pcc2',
        positionId: 'pos_2',
        reviewCycleDays: 730,
        riskLevel: 'medium',
        ruleIds: ['rule1', 'rule3', 'rule4', 'rule5', 'rule6'],
        assignedReviewerIds: ['u_hr1'],
        createdAt: past(60),
        updatedAt: past(60),
      },
    ],
    interventionTasks: [],
    reviewRecords: [],
  };
}

function loadFile<K extends keyof DataSchema>(key: K): DataSchema[K] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) {
    const defaultData = getDefaultData();
    fs.writeFileSync(filePath, JSON.stringify(defaultData[key], null, 2), 'utf-8');
    return defaultData[key];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DataSchema[K];
  } catch {
    const defaultData = getDefaultData();
    return defaultData[key];
  }
}

function saveFile<K extends keyof DataSchema>(key: K, data: DataSchema[K]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${key}.json`);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

export function loadAllData(): DataSchema {
  return {
    users: loadFile('users'),
    positions: loadFile('positions'),
    courses: loadFile('courses'),
    questions: loadFile('questions'),
    enrollments: loadFile('enrollments'),
    examAttempts: loadFile('examAttempts'),
    certificates: loadFile('certificates'),
    reminders: loadFile('reminders'),
    exportHistory: loadFile('exportHistory'),
    interventionRules: loadFile('interventionRules'),
    positionCertConfigs: loadFile('positionCertConfigs'),
    interventionTasks: loadFile('interventionTasks'),
    reviewRecords: loadFile('reviewRecords'),
  };
}

export function saveAllData(data: DataSchema): void {
  for (const key of FILES) {
    saveFile(key, data[key]);
  }
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

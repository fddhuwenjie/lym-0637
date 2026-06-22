import { loadAllData, saveAllData, genId } from './dataStore.js';
import type {
  DataSchema,
} from './dataStore.js';
import type {
  User,
  Position,
  Course,
  Question,
  Enrollment,
  ExamAttempt,
  Certificate,
  Reminder,
  ExportHistory,
  ComplianceRecord,
  ExamAnswer,
  CertificateStatus,
  ReminderType,
  InterventionRule,
  PositionCertConfig,
  InterventionTask,
  ReviewRecord,
  InterventionTriggerType,
  InterventionActionType,
  InterventionTaskStatus,
  ReviewResult,
  CertificateRiskLevel,
} from '../../shared/types.js';

const ONE_DAY_MS = 86400000;

function nowISO(): string {
  return new Date().toISOString();
}

function addDaysISO(dateStr: string, days: number): string {
  return new Date(new Date(dateStr).getTime() + days * ONE_DAY_MS).toISOString();
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / ONE_DAY_MS);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

export function computeCertificateStatus(expiresAt: string): CertificateStatus {
  const today = new Date();
  const exp = new Date(expiresAt);
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / ONE_DAY_MS);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'valid';
}

export function refreshAllCertificateStatuses(data: DataSchema): void {
  for (const cert of data.certificates) {
    cert.status = computeCertificateStatus(cert.expiresAt);
  }
}

export function generateReminders(data: DataSchema): void {
  const existing = new Set(
    data.reminders.map((r) => `${r.userId}_${r.certificateId}_${r.type}`)
  );
  const today = nowISO();
  for (const cert of data.certificates) {
    const exp = new Date(cert.expiresAt);
    const now = new Date(today);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / ONE_DAY_MS);
    let type: ReminderType | null = null;
    if (diffDays < 0) type = 'expired';
    else if (diffDays <= 7) type = 'expiring_7d';
    else if (diffDays <= 30) type = 'expiring_30d';
    if (type) {
      const key = `${cert.userId}_${cert.id}_${type}`;
      if (!existing.has(key)) {
        data.reminders.push({
          id: genId('r'),
          userId: cert.userId,
          certificateId: cert.id,
          type,
          sentAt: today,
          acknowledged: false,
        });
      }
    }
  }
}

export function canStartExam(
  data: DataSchema,
  userId: string,
  courseId: string
): { ok: boolean; reason?: string } {
  const user = data.users.find((u) => u.id === userId);
  if (!user) return { ok: false, reason: '用户不存在' };

  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return { ok: false, reason: '课程不存在' };

  const enrollment = data.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId
  );
  if (!enrollment) return { ok: false, reason: '未报名该课程' };
  if (enrollment.progress < 100) {
    return { ok: false, reason: '学习进度未完成，不能参加考试' };
  }

  const attempts = data.examAttempts.filter(
    (a) => a.userId === userId && a.courseId === courseId && a.submitted
  );

  const hasUnsubmitted = data.examAttempts.some(
    (a) => a.userId === userId && a.courseId === courseId && !a.submitted
  );
  if (hasUnsubmitted) {
    return { ok: false, reason: '有未完成的考试，请先完成或提交' };
  }

  const lastPassed = attempts
    .filter((a) => a.passed)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())[0];

  const position = user.positionId
    ? data.positions.find((p) => p.id === user.positionId)
    : null;
  const maxRetakes = position?.maxRetakeCount ?? 3;

  const attemptNumber = attempts.length + 1;

  if (lastPassed) {
    const cert = data.certificates
      .filter((c) => c.userId === userId && c.courseId === courseId)
      .sort((a, b) => b.version - a.version)[0];
    if (cert && cert.status !== 'expired') {
      return { ok: false, reason: '已持有有效证书，无需重新考试' };
    }
    return { ok: true };
  }

  if (attemptNumber > maxRetakes + 1) {
    return { ok: false, reason: `补考次数已达上限（最多${maxRetakes}次补考）` };
  }

  return { ok: true };
}

export function createExamAttempt(
  data: DataSchema,
  userId: string,
  courseId: string
): ExamAttempt {
  const course = data.courses.find((c) => c.id === courseId)!;
  const questions = data.questions.filter((q) => q.courseId === courseId);
  const shuffled = shuffle(questions);
  const picked = shuffled.slice(0, Math.min(course.questionCount, shuffled.length));
  const questionIds = picked.map((q) => q.id);
  const version =
    picked.length > 0 ? Math.max(...picked.map((q) => q.version)) : 1;

  const submittedAttempts = data.examAttempts.filter(
    (a) => a.userId === userId && a.courseId === courseId && a.submitted
  );

  const attempt: ExamAttempt = {
    id: genId('ex'),
    userId,
    courseId,
    questionVersion: version,
    questionIds,
    answers: questionIds.map((qid) => ({
      questionId: qid,
      selectedAnswers: [],
    })),
    score: 0,
    passed: false,
    attemptNumber: submittedAttempts.length + 1,
    submitted: false,
    startedAt: nowISO(),
    submittedAt: null,
  };
  data.examAttempts.push(attempt);
  return attempt;
}

export function canSubmitExam(
  data: DataSchema,
  attemptId: string
): { ok: boolean; reason?: string } {
  const attempt = data.examAttempts.find((a) => a.id === attemptId);
  if (!attempt) return { ok: false, reason: '考试记录不存在' };
  if (attempt.submitted) return { ok: false, reason: '试卷已提交，不能重复提交' };
  return { ok: true };
}

export function gradeExam(
  data: DataSchema,
  attemptId: string,
  answers: ExamAnswer[]
): ExamAttempt {
  const attempt = data.examAttempts.find((a) => a.id === attemptId)!;
  const course = data.courses.find((c) => c.id === attempt.courseId)!;
  const questionMap = new Map(
    data.questions.map((q) => [q.id, q])
  );

  attempt.answers = answers;
  let correctCount = 0;
  for (const ans of answers) {
    const q = questionMap.get(ans.questionId);
    if (!q) continue;
    if (arraysEqual(q.correctAnswers, ans.selectedAnswers)) {
      correctCount++;
    }
  }
  const total = attempt.questionIds.length || 1;
  attempt.score = Math.round((correctCount / total) * 100);
  attempt.passed = attempt.score >= course.passingScore;
  attempt.submitted = true;
  attempt.submittedAt = nowISO();

  if (attempt.passed) {
    issueOrRenewCertificate(data, attempt);
  }
  return attempt;
}

function issueOrRenewCertificate(data: DataSchema, attempt: ExamAttempt): void {
  const course = data.courses.find((c) => c.id === attempt.courseId)!;
  const existingCerts = data.certificates
    .filter((c) => c.userId === attempt.userId && c.courseId === attempt.courseId)
    .sort((a, b) => b.version - a.version);
  const lastVersion = existingCerts[0]?.version ?? 0;
  const issuedAt = nowISO();
  const expiresAt = addDaysISO(issuedAt, course.certificateValidDays);
  const cert: Certificate = {
    id: genId('cert'),
    userId: attempt.userId,
    courseId: attempt.courseId,
    examAttemptId: attempt.id,
    issuedAt,
    expiresAt,
    status: computeCertificateStatus(expiresAt),
    version: lastVersion + 1,
  };
  data.certificates.push(cert);
}

export function renewCertificate(
  data: DataSchema,
  certificateId: string,
  userId: string
): { ok: boolean; reason?: string; examAttempt?: ExamAttempt } {
  const cert = data.certificates.find((c) => c.id === certificateId);
  if (!cert) return { ok: false, reason: '证书不存在' };
  if (cert.userId !== userId) {
    return { ok: false, reason: '无权操作该证书' };
  }
  const check = canStartExam(data, userId, cert.courseId);
  if (!check.ok && check.reason !== '已持有有效证书，无需重新考试') {
    return check;
  }
  const attempt = createExamAttempt(data, userId, cert.courseId);
  return { ok: true, examAttempt: attempt };
}

export function getLatestPassedAttempt(
  data: DataSchema,
  userId: string,
  courseId: string
): ExamAttempt | null {
  const attempts = data.examAttempts
    .filter((a) => a.userId === userId && a.courseId === courseId && a.passed && a.submitted)
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  return attempts[0] ?? null;
}

export function getUserCompliance(
  data: DataSchema,
  userId: string
): ComplianceRecord {
  const user = data.users.find((u) => u.id === userId)!;
  const position = user.positionId
    ? data.positions.find((p) => p.id === user.positionId) ?? null
    : null;
  const missingCourses: { courseId: string; courseName: string }[] = [];
  const expiredCerts: { courseId: string; courseName: string; expiresAt: string }[] = [];

  if (position) {
    for (const cid of position.requiredCourseIds) {
      const course = data.courses.find((c) => c.id === cid);
      const passed = getLatestPassedAttempt(data, userId, cid);
      if (!passed) {
        missingCourses.push({
          courseId: cid,
          courseName: course?.name ?? cid,
        });
      }
    }
    for (const cid of position.requiredCertificateCourseIds) {
      const course = data.courses.find((c) => c.id === cid);
      const latestCerts = data.certificates
        .filter((c) => c.userId === userId && c.courseId === cid)
        .sort((a, b) => b.version - a.version);
      const latest = latestCerts[0];
      if (!latest || latest.status === 'expired') {
        expiredCerts.push({
          courseId: cid,
          courseName: course?.name ?? cid,
          expiresAt: latest?.expiresAt ?? '-',
        });
      }
    }
  }

  return {
    userId: user.id,
    userName: user.name,
    positionId: user.positionId,
    positionName: position?.name ?? null,
    isPositionCompliant: missingCourses.length === 0 && expiredCerts.length === 0,
    missingCourses,
    expiredCertificates: expiredCerts,
  };
}

export function getAllCompliance(data: DataSchema): ComplianceRecord[] {
  refreshAllCertificateStatuses(data);
  generateReminders(data);
  return data.users.map((u) => getUserCompliance(data, u.id));
}

export function updateQuestion(
  data: DataSchema,
  id: string,
  patch: Partial<Question>
): Question | null {
  const q = data.questions.find((x) => x.id === id);
  if (!q) return null;
  const changedKeys = ['courseId', 'type', 'content', 'options', 'correctAnswers'];
  let changed = false;
  for (const k of changedKeys) {
    if (k in patch) {
      if (k === 'options' || k === 'correctAnswers') {
        const oldVal = (q as any)[k] as unknown[];
        const newVal = (patch as any)[k] as unknown[];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changed = true;
          break;
        }
      } else if ((q as any)[k] !== (patch as any)[k]) {
        changed = true;
        break;
      }
    }
  }
  Object.assign(q, patch);
  q.updatedAt = nowISO();
  if (changed) {
    q.version++;
  }
  return q;
}

export function getQuestionsForExam(
  data: DataSchema,
  attemptId: string
): Question[] {
  const attempt = data.examAttempts.find((a) => a.id === attemptId);
  if (!attempt) return [];
  const qs = attempt.questionIds
    .map((qid) => data.questions.find((q) => q.id === qid))
    .filter((q): q is Question => !!q);
  return qs;
}

export function getExamAttemptWithQuestions(
  data: DataSchema,
  attemptId: string
): (ExamAttempt & { questions: Question[] }) | null {
  const attempt = data.examAttempts.find((a) => a.id === attemptId);
  if (!attempt) return null;
  const questions = getQuestionsForExam(data, attemptId);
  return { ...attempt, questions };
}

export function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function enrichPositionCertConfig(
  data: DataSchema,
  config: PositionCertConfig
): PositionCertConfig & { positionName?: string } {
  const position = data.positions.find((p) => p.id === config.positionId);
  return { ...config, positionName: position?.name };
}

export function getAllPositionCertConfigs(
  data: DataSchema
): (PositionCertConfig & { positionName?: string })[] {
  return data.positionCertConfigs.map((c) => enrichPositionCertConfig(data, c));
}

export function createPositionCertConfig(
  data: DataSchema,
  input: Omit<PositionCertConfig, 'id' | 'createdAt' | 'updatedAt'>
): PositionCertConfig {
  const now = nowISO();
  const config: PositionCertConfig = {
    id: genId('pcc'),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  data.positionCertConfigs.push(config);
  return config;
}

export function updatePositionCertConfig(
  data: DataSchema,
  id: string,
  patch: Partial<Omit<PositionCertConfig, 'id' | 'createdAt'>>
): PositionCertConfig | null {
  const config = data.positionCertConfigs.find((c) => c.id === id);
  if (!config) return null;
  Object.assign(config, patch, { updatedAt: nowISO() });
  return config;
}

export function deletePositionCertConfig(data: DataSchema, id: string): boolean {
  const idx = data.positionCertConfigs.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  data.positionCertConfigs.splice(idx, 1);
  return true;
}

export function getAllInterventionRules(data: DataSchema): InterventionRule[] {
  return [...data.interventionRules].sort((a, b) => a.priority - b.priority);
}

export function createInterventionRule(
  data: DataSchema,
  input: Omit<InterventionRule, 'id'>
): InterventionRule {
  const rule: InterventionRule = {
    id: genId('rule'),
    ...input,
  };
  data.interventionRules.push(rule);
  return rule;
}

export function updateInterventionRule(
  data: DataSchema,
  id: string,
  patch: Partial<Omit<InterventionRule, 'id'>>
): InterventionRule | null {
  const rule = data.interventionRules.find((r) => r.id === id);
  if (!rule) return null;
  Object.assign(rule, patch);
  return rule;
}

export function deleteInterventionRule(data: DataSchema, id: string): boolean {
  const idx = data.interventionRules.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  data.interventionRules.splice(idx, 1);
  return true;
}

function enrichInterventionTask(
  data: DataSchema,
  task: InterventionTask
): InterventionTask {
  const user = data.users.find((u) => u.id === task.userId);
  const position = task.positionId
    ? data.positions.find((p) => p.id === task.positionId)
    : undefined;
  const course = task.targetCourseId
    ? data.courses.find((c) => c.id === task.targetCourseId)
    : undefined;
  const reviewer = task.assignedToId
    ? data.users.find((u) => u.id === task.assignedToId)
    : undefined;
  return {
    ...task,
    userName: user?.name,
    positionName: position?.name,
    targetCourseName: course?.name,
    assignedToName: reviewer?.name,
  };
}

export function getAllInterventionTasks(
  data: DataSchema
): InterventionTask[] {
  refreshAllCertificateStatuses(data);
  return data.interventionTasks
    .map((t) => enrichInterventionTask(data, t))
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function createInterventionTask(
  data: DataSchema,
  input: Omit<InterventionTask, 'id' | 'createdAt' | 'notes' | 'status'> & {
    status?: InterventionTaskStatus;
  }
): InterventionTask {
  const task: InterventionTask = {
    id: genId('task'),
    status: 'pending',
    notes: [],
    ...input,
    createdAt: nowISO(),
  };
  data.interventionTasks.push(task);
  return enrichInterventionTask(data, task);
}

export function updateInterventionTask(
  data: DataSchema,
  id: string,
  patch: Partial<Omit<InterventionTask, 'id' | 'createdAt'>> & {
    addNote?: string;
  }
): InterventionTask | null {
  const task = data.interventionTasks.find((t) => t.id === id);
  if (!task) return null;
  if (patch.addNote) {
    task.notes.push(`[${nowISO()}] ${patch.addNote}`);
    delete (patch as any).addNote;
  }
  if (patch.status === 'completed' && !task.completedAt) {
    patch.completedAt = nowISO();
  }
  Object.assign(task, patch);
  return enrichInterventionTask(data, task);
}

export function deleteInterventionTask(data: DataSchema, id: string): boolean {
  const idx = data.interventionTasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  data.interventionTasks.splice(idx, 1);
  return true;
}

function enrichReviewRecord(
  data: DataSchema,
  record: ReviewRecord
): ReviewRecord {
  const user = data.users.find((u) => u.id === record.userId);
  const position = record.positionId
    ? data.positions.find((p) => p.id === record.positionId)
    : undefined;
  const course = record.courseId
    ? data.courses.find((c) => c.id === record.courseId)
    : undefined;
  const reviewer = record.reviewerId
    ? data.users.find((u) => u.id === record.reviewerId)
    : undefined;
  return {
    ...record,
    userName: user?.name,
    positionName: position?.name,
    courseName: course?.name,
    reviewerName: reviewer?.name,
  };
}

export function getAllReviewRecords(data: DataSchema): ReviewRecord[] {
  return data.reviewRecords
    .map((r) => enrichReviewRecord(data, r))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createReviewRecord(
  data: DataSchema,
  input: Omit<ReviewRecord, 'id' | 'createdAt'>
): ReviewRecord {
  const record: ReviewRecord = {
    id: genId('rev'),
    ...input,
    createdAt: nowISO(),
  };
  data.reviewRecords.push(record);
  return enrichReviewRecord(data, record);
}

export function updateReviewRecord(
  data: DataSchema,
  id: string,
  patch: Partial<Omit<ReviewRecord, 'id' | 'createdAt'>>
): ReviewRecord | null {
  const record = data.reviewRecords.find((r) => r.id === id);
  if (!record) return null;
  Object.assign(record, patch);
  return enrichReviewRecord(data, record);
}

interface DetectOptions {
  positionId?: string;
  userId?: string;
}

export function detectAndGenerateInterventions(
  data: DataSchema,
  options: DetectOptions = {}
): InterventionTask[] {
  refreshAllCertificateStatuses(data);
  const generatedTasks: InterventionTask[] = [];
  const today = nowISO();

  const existingKeys = new Set(
    data.interventionTasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .map((t) => `${t.userId}_${t.triggerType}_${t.targetCourseId || t.targetCertificateId || 'general'}`)
  );

  const usersToCheck = options.userId
    ? data.users.filter((u) => u.id === options.userId)
    : data.users.filter((u) => u.role === 'employee');

  for (const user of usersToCheck) {
    if (!user.positionId) continue;
    if (options.positionId && user.positionId !== options.positionId) continue;

    const position = data.positions.find((p) => p.id === user.positionId);
    if (!position) continue;

    const config = data.positionCertConfigs.find(
      (c) => c.positionId === user.positionId
    );
    const enabledRuleMap = new Map<InterventionTriggerType, InterventionRule[]>();
    if (config) {
      for (const ruleId of config.ruleIds) {
        const rule = data.interventionRules.find(
          (r) => r.id === ruleId && r.enabled
        );
        if (rule) {
          const arr = enabledRuleMap.get(rule.triggerType) || [];
          arr.push(rule);
          enabledRuleMap.set(rule.triggerType, arr);
        }
      }
    }

    const riskLevel = config?.riskLevel ?? 'low';
    const reviewerId =
      config?.assignedReviewerIds?.[0] || data.users.find((u) => u.role === 'hr')?.id;

    const userCerts = data.certificates
      .filter((c) => c.userId === user.id)
      .sort((a, b) => b.version - a.version);

    const latestCertByCourse = new Map<string, Certificate>();
    for (const cert of userCerts) {
      if (!latestCertByCourse.has(cert.courseId)) {
        latestCertByCourse.set(cert.courseId, cert);
      }
    }

    const requiredCertCourseIds = position.requiredCertificateCourseIds || [];
    for (const courseId of requiredCertCourseIds) {
      const cert = latestCertByCourse.get(courseId);
      const course = data.courses.find((c) => c.id === courseId);
      if (!cert) {
        const rules = enabledRuleMap.get('required_cert_gap') || [];
        for (const rule of rules) {
          const key = `${user.id}_required_cert_gap_${courseId}`;
          if (!existingKeys.has(key)) {
            const task = createInterventionTask(data, {
              userId: user.id,
              positionId: position.id,
              triggerType: 'required_cert_gap',
              triggerDescription: `岗位【${position.name}】缺少必修证书：${course?.name || courseId}`,
              targetCourseId: courseId,
              targetCertificateId: undefined,
              actions: rule.actions,
              priority: rule.priority,
              assignedToId: reviewerId,
              dueDate: addDaysISO(today, 14),
            });
            generatedTasks.push(task);
            existingKeys.add(key);
          }
        }
        continue;
      }

      const diffDays = Math.ceil(
        (new Date(cert.expiresAt).getTime() - new Date(today).getTime()) / ONE_DAY_MS
      );

      if (diffDays < 0) {
        const rules = enabledRuleMap.get('cert_expired') || [];
        for (const rule of rules) {
          const key = `${user.id}_cert_expired_${cert.id}`;
          if (!existingKeys.has(key)) {
            const task = createInterventionTask(data, {
              userId: user.id,
              positionId: position.id,
              triggerType: 'cert_expired',
              triggerDescription: `证书【${course?.name || courseId}】已过期 ${Math.abs(diffDays)} 天`,
              targetCourseId: courseId,
              targetCertificateId: cert.id,
              actions: rule.actions,
              priority: rule.priority,
              assignedToId: reviewerId,
              dueDate: addDaysISO(today, 7),
            });
            generatedTasks.push(task);
            existingKeys.add(key);
          }
        }
      } else {
        const expiringRules = enabledRuleMap.get('cert_expiring') || [];
        for (const rule of expiringRules) {
          const threshold = rule.triggerValue ?? 30;
          if (diffDays <= threshold) {
            const key = `${user.id}_cert_expiring_${cert.id}_${threshold}`;
            if (!existingKeys.has(key)) {
              const task = createInterventionTask(data, {
                userId: user.id,
                positionId: position.id,
                triggerType: 'cert_expiring',
                triggerDescription: `证书【${course?.name || courseId}】将在 ${diffDays} 天后到期`,
                targetCourseId: courseId,
                targetCertificateId: cert.id,
                actions: rule.actions,
                priority: rule.priority,
                assignedToId: reviewerId,
                dueDate: addDaysISO(today, threshold),
              });
              generatedTasks.push(task);
              existingKeys.add(key);
            }
          }
        }
      }
    }

    const requiredCourseIds = position.requiredCourseIds || [];
    for (const courseId of requiredCourseIds) {
      const latestPassed = getLatestPassedAttempt(data, user.id, courseId);
      if (!latestPassed) {
        const rules = enabledRuleMap.get('required_course_gap') || [];
        for (const rule of rules) {
          const key = `${user.id}_required_course_gap_${courseId}`;
          if (!existingKeys.has(key)) {
            const course = data.courses.find((c) => c.id === courseId);
            const task = createInterventionTask(data, {
              userId: user.id,
              positionId: position.id,
              triggerType: 'required_course_gap',
              triggerDescription: `岗位【${position.name}】缺少必修课程：${course?.name || courseId}`,
              targetCourseId: courseId,
              actions: rule.actions,
              priority: rule.priority,
              assignedToId: reviewerId,
              dueDate: addDaysISO(today, 14),
            });
            generatedTasks.push(task);
            existingKeys.add(key);
          }
        }
      }
    }

    const failRules = enabledRuleMap.get('exam_fail_repeated') || [];
    for (const courseId of [...requiredCourseIds, ...requiredCertCourseIds]) {
      const attempts = data.examAttempts
        .filter(
          (a) =>
            a.userId === user.id &&
            a.courseId === courseId &&
            a.submitted &&
            !a.passed
        )
        .sort(
          (a, b) =>
            new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
        );
      for (const rule of failRules) {
        const threshold = rule.triggerValue ?? 2;
        if (attempts.length >= threshold) {
          const latestPassed = getLatestPassedAttempt(data, user.id, courseId);
          if (!latestPassed) {
            const key = `${user.id}_exam_fail_repeated_${courseId}`;
            if (!existingKeys.has(key)) {
              const course = data.courses.find((c) => c.id === courseId);
              const task = createInterventionTask(data, {
                userId: user.id,
                positionId: position.id,
                triggerType: 'exam_fail_repeated',
                triggerDescription: `课程【${course?.name || courseId}】已连续 ${attempts.length} 次考试未通过`,
                targetCourseId: courseId,
                actions: rule.actions,
                priority: rule.priority,
                assignedToId: reviewerId,
                dueDate: addDaysISO(today, 10),
              });
              generatedTasks.push(task);
              existingKeys.add(key);
            }
          }
        }
      }
    }
  }

  return generatedTasks;
}

export function buildInterventionExportRows(
  data: DataSchema
): Record<string, any>[] {
  const tasks = getAllInterventionTasks(data);
  return tasks.map((t) => ({
    id: t.id,
    userId: t.userId,
    userName: t.userName ?? '',
    positionId: t.positionId ?? '',
    positionName: t.positionName ?? '',
    triggerType: t.triggerType,
    triggerDescription: t.triggerDescription,
    targetCourseId: t.targetCourseId ?? '',
    targetCourseName: t.targetCourseName ?? '',
    actions: t.actions.join(';'),
    priority: t.priority,
    status: t.status,
    assignedToId: t.assignedToId ?? '',
    assignedToName: t.assignedToName ?? '',
    dueDate: t.dueDate ?? '',
    completedAt: t.completedAt ?? '',
    createdAt: t.createdAt,
    notes: t.notes.join(' | '),
  }));
}

export function buildReviewExportRows(
  data: DataSchema
): Record<string, any>[] {
  const records = getAllReviewRecords(data);
  return records.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName ?? '',
    positionId: r.positionId ?? '',
    positionName: r.positionName ?? '',
    certificateId: r.certificateId ?? '',
    courseId: r.courseId ?? '',
    courseName: r.courseName ?? '',
    reviewerId: r.reviewerId ?? '',
    reviewerName: r.reviewerName ?? '',
    reviewType: r.reviewType,
    result: r.result,
    riskLevel: r.riskLevel,
    reviewDate: r.reviewDate,
    nextReviewDate: r.nextReviewDate ?? '',
    comments: r.comments,
    taskId: r.taskId ?? '',
    createdAt: r.createdAt,
  }));
}

export { nowISO, addDaysISO, daysBetween, loadAllData, saveAllData, genId };

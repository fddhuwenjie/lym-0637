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

export { nowISO, addDaysISO, daysBetween, loadAllData, saveAllData, genId };

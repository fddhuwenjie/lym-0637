import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import { getAllCompliance, toCSV } from '../services/businessService.js';

const router = express.Router();

type ExportType =
  | 'positions'
  | 'courses'
  | 'questions'
  | 'users'
  | 'enrollments'
  | 'exams'
  | 'certificates'
  | 'reminders'
  | 'compliance';

const VALID_TYPES: ExportType[] = [
  'positions',
  'courses',
  'questions',
  'users',
  'enrollments',
  'exams',
  'certificates',
  'reminders',
  'compliance',
];

function buildRows(type: ExportType, data: ReturnType<typeof loadAllData>): Record<string, any>[] {
  switch (type) {
    case 'positions':
      return data.positions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        maxRetakeCount: p.maxRetakeCount,
        requiredCourseIds: p.requiredCourseIds.join(';'),
        requiredCertificateCourseIds: p.requiredCertificateCourseIds.join(';'),
      }));
    case 'courses':
      return data.courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        credit: c.credit,
        passingScore: c.passingScore,
        questionCount: c.questionCount,
        certificateValidDays: c.certificateValidDays,
        reminderDays: c.reminderDays,
        createdAt: c.createdAt,
      }));
    case 'questions':
      return data.questions.map((q) => ({
        id: q.id,
        courseId: q.courseId,
        type: q.type,
        content: q.content,
        options: q.options.join(';'),
        correctAnswers: q.correctAnswers.join(';'),
        version: q.version,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
    case 'users':
      return data.users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        positionId: u.positionId ?? '',
        avatar: u.avatar,
      }));
    case 'enrollments':
      return data.enrollments.map((e) => ({
        id: e.id,
        userId: e.userId,
        courseId: e.courseId,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt ?? '',
      }));
    case 'exams':
      return data.examAttempts.map((a) => ({
        id: a.id,
        userId: a.userId,
        courseId: a.courseId,
        questionVersion: a.questionVersion,
        score: a.score,
        passed: a.passed ? '是' : '否',
        attemptNumber: a.attemptNumber,
        submitted: a.submitted ? '是' : '否',
        startedAt: a.startedAt,
        submittedAt: a.submittedAt ?? '',
      }));
    case 'certificates':
      return data.certificates.map((c) => ({
        id: c.id,
        userId: c.userId,
        courseId: c.courseId,
        examAttemptId: c.examAttemptId,
        issuedAt: c.issuedAt,
        expiresAt: c.expiresAt,
        status: c.status,
        version: c.version,
      }));
    case 'reminders':
      return data.reminders.map((r) => ({
        id: r.id,
        userId: r.userId,
        certificateId: r.certificateId,
        type: r.type,
        sentAt: r.sentAt,
        acknowledged: r.acknowledged ? '是' : '否',
      }));
    case 'compliance': {
      const records = getAllCompliance(data);
      return records.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        positionId: r.positionId ?? '',
        positionName: r.positionName ?? '',
        isPositionCompliant: r.isPositionCompliant ? '是' : '否',
        missingCourses: r.missingCourses.map((m) => m.courseName).join(';'),
        expiredCertificates: r.expiredCertificates
          .map((e) => `${e.courseName}(${e.expiresAt})`)
          .join(';'),
      }));
    }
  }
}

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const type = req.query.type as ExportType | undefined;
    const createdBy = (req.query.createdBy as string) ?? 'system';
    if (!type || !VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: `type 必须是: ${VALID_TYPES.join(', ')}` });
    }
    const rows = buildRows(type, data);
    const csv = toCSV(rows);
    const filename = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    data.exportHistory.push({
      id: genId('exp'),
      type,
      filename,
      createdAt: new Date().toISOString(),
      createdBy,
    });
    saveAllData(data);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/history', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const history = [...data.exportHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

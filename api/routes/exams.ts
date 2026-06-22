import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  canStartExam,
  createExamAttempt,
  canSubmitExam,
  gradeExam,
  getExamAttemptWithQuestions,
} from '../services/businessService.js';
import type { ExamAnswer } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const userId = req.query.userId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    let attempts = data.examAttempts;
    if (userId) {
      attempts = attempts.filter((a) => a.userId === userId);
    }
    if (courseId) {
      attempts = attempts.filter((a) => a.courseId === courseId);
    }
    attempts.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    res.json({ success: true, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const full = getExamAttemptWithQuestions(data, req.params.id);
    if (!full) {
      return res.status(404).json({ success: false, error: '考试记录不存在' });
    }
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/start', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const { userId, courseId } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ success: false, error: 'userId 和 courseId 为必填' });
    }
    const check = canStartExam(data, userId, courseId);
    if (!check.ok) {
      return res.status(400).json({ success: false, error: check.reason });
    }
    const attempt = createExamAttempt(data, userId, courseId);
    saveAllData(data);
    const full = getExamAttemptWithQuestions(data, attempt.id);
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/:id/submit', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const check = canSubmitExam(data, req.params.id);
    if (!check.ok) {
      return res.status(400).json({ success: false, error: check.reason });
    }
    const { answers } = req.body as { answers: ExamAnswer[] };
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'answers 必须是数组' });
    }
    const graded = gradeExam(data, req.params.id, answers);
    saveAllData(data);
    const full = getExamAttemptWithQuestions(data, graded.id);
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

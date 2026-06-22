import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import type { Enrollment } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const userId = req.query.userId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    let enrollments = data.enrollments;
    if (userId) {
      enrollments = enrollments.filter((e) => e.userId === userId);
    }
    if (courseId) {
      enrollments = enrollments.filter((e) => e.courseId === courseId);
    }
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const enrollment = data.enrollments.find((e) => e.id === req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, error: '报名记录不存在' });
    }
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const { userId, courseId } = req.body;
    if (!userId || !courseId) {
      return res.status(400).json({ success: false, error: 'userId 和 courseId 为必填' });
    }
    const user = data.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    const course = data.courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }
    const exists = data.enrollments.find(
      (e) => e.userId === userId && e.courseId === courseId
    );
    if (exists) {
      return res.status(400).json({ success: false, error: '已报名该课程' });
    }
    const now = new Date().toISOString();
    const enrollment: Enrollment = {
      id: genId('en'),
      userId,
      courseId,
      progress: 0,
      enrolledAt: now,
      completedAt: null,
    };
    data.enrollments.push(enrollment);
    saveAllData(data);
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id/progress', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const enrollment = data.enrollments.find((e) => e.id === req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, error: '报名记录不存在' });
    }
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, error: 'progress 必须是 0-100 的数字' });
    }
    enrollment.progress = progress;
    if (progress >= 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date().toISOString();
    }
    saveAllData(data);
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const idx = data.enrollments.findIndex((e) => e.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '报名记录不存在' });
    }
    data.enrollments.splice(idx, 1);
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

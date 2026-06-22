import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import type { Course } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    res.json({ success: true, data: data.courses });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const course = data.courses.find((c) => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Partial<Course>;
    const course: Course = {
      id: genId('c'),
      name: body.name ?? '新课程',
      description: body.description ?? '',
      content: body.content ?? '',
      credit: body.credit ?? 1,
      passingScore: body.passingScore ?? 60,
      questionCount: body.questionCount ?? 5,
      certificateValidDays: body.certificateValidDays ?? 365,
      reminderDays: body.reminderDays ?? 30,
      createdAt: new Date().toISOString(),
    };
    data.courses.push(course);
    saveAllData(data);
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const course = data.courses.find((c) => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }
    Object.assign(course, req.body);
    saveAllData(data);
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const idx = data.courses.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '课程不存在' });
    }
    data.courses.splice(idx, 1);
    data.questions = data.questions.filter((q) => q.courseId !== req.params.id);
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

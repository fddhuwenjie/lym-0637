import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import { updateQuestion } from '../services/businessService.js';
import type { Question } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const courseId = req.query.courseId as string | undefined;
    let questions = data.questions;
    if (courseId) {
      questions = questions.filter((q) => q.courseId === courseId);
    }
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const question = data.questions.find((q) => q.id === req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: '题目不存在' });
    }
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Partial<Question>;
    const now = new Date().toISOString();
    const question: Question = {
      id: genId('q'),
      courseId: body.courseId ?? '',
      type: body.type ?? 'single',
      content: body.content ?? '',
      options: body.options ?? [],
      correctAnswers: body.correctAnswers ?? [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    data.questions.push(question);
    saveAllData(data);
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const updated = updateQuestion(data, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: '题目不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const idx = data.questions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '题目不存在' });
    }
    data.questions.splice(idx, 1);
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

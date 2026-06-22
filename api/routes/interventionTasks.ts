import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  getAllInterventionTasks,
  createInterventionTask,
  updateInterventionTask,
  deleteInterventionTask,
  detectAndGenerateInterventions,
} from '../services/businessService.js';
import type { InterventionTask } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    let tasks = getAllInterventionTasks(data);
    const userId = req.query.userId as string | undefined;
    const positionId = req.query.positionId as string | undefined;
    const status = req.query.status as string | undefined;
    const triggerType = req.query.triggerType as string | undefined;

    if (userId) {
      tasks = tasks.filter((t) => t.userId === userId);
    }
    if (positionId) {
      tasks = tasks.filter((t) => t.positionId === positionId);
    }
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (triggerType) {
      tasks = tasks.filter((t) => t.triggerType === triggerType);
    }
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const tasks = getAllInterventionTasks(data);
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: '干预任务不存在' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/detect', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const { positionId, userId } = req.body || {};
    const generated = detectAndGenerateInterventions(data, {
      positionId,
      userId,
    });
    saveAllData(data);
    res.json({
      success: true,
      data: {
        generatedCount: generated.length,
        tasks: generated,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Partial<InterventionTask> & {
      userId: string;
      triggerType: any;
      triggerDescription: string;
      actions: any[];
      priority: number;
    };
    if (!body.userId || !body.triggerType || !body.triggerDescription) {
      return res
        .status(400)
        .json({ success: false, error: 'userId、triggerType、triggerDescription 为必填' });
    }
    const task = createInterventionTask(data, body as any);
    saveAllData(data);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const task = updateInterventionTask(data, req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ success: false, error: '干预任务不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const ok = deleteInterventionTask(data, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: '干预任务不存在' });
    }
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

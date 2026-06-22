import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  getAllReviewRecords,
  createReviewRecord,
  updateReviewRecord,
} from '../services/businessService.js';
import type { ReviewRecord } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    let records = getAllReviewRecords(data);
    const userId = req.query.userId as string | undefined;
    const positionId = req.query.positionId as string | undefined;
    const reviewerId = req.query.reviewerId as string | undefined;
    const result = req.query.result as string | undefined;
    const taskId = req.query.taskId as string | undefined;

    if (userId) {
      records = records.filter((r) => r.userId === userId);
    }
    if (positionId) {
      records = records.filter((r) => r.positionId === positionId);
    }
    if (reviewerId) {
      records = records.filter((r) => r.reviewerId === reviewerId);
    }
    if (result) {
      records = records.filter((r) => r.result === result);
    }
    if (taskId) {
      records = records.filter((r) => r.taskId === taskId);
    }
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const records = getAllReviewRecords(data);
    const record = records.find((r) => r.id === req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: '复核记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Omit<ReviewRecord, 'id' | 'createdAt'>;
    if (!body.userId || !body.reviewType || !body.result) {
      return res
        .status(400)
        .json({ success: false, error: 'userId、reviewType、result 为必填' });
    }
    const record = createReviewRecord(data, body);
    saveAllData(data);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const record = updateReviewRecord(data, req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ success: false, error: '复核记录不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

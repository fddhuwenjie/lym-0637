import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import type { Position } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    res.json({ success: true, data: data.positions });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const position = data.positions.find((p) => p.id === req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, error: '岗位不存在' });
    }
    res.json({ success: true, data: position });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Partial<Position>;
    const position: Position = {
      id: genId('pos'),
      name: body.name ?? '新岗位',
      description: body.description ?? '',
      maxRetakeCount: body.maxRetakeCount ?? 3,
      requiredCourseIds: body.requiredCourseIds ?? [],
      requiredCertificateCourseIds: body.requiredCertificateCourseIds ?? [],
    };
    data.positions.push(position);
    saveAllData(data);
    res.json({ success: true, data: position });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const position = data.positions.find((p) => p.id === req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, error: '岗位不存在' });
    }
    Object.assign(position, req.body);
    saveAllData(data);
    res.json({ success: true, data: position });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const idx = data.positions.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '岗位不存在' });
    }
    data.positions.splice(idx, 1);
    for (const u of data.users) {
      if (u.positionId === req.params.id) {
        u.positionId = null;
      }
    }
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

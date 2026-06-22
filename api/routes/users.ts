import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData, genId } from '../services/dataStore.js';
import type { User } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    res.json({ success: true, data: data.users });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Partial<User>;
    const user: User = {
      id: genId('u'),
      name: body.name ?? '新用户',
      role: body.role ?? 'employee',
      positionId: body.positionId ?? null,
      avatar: body.avatar ?? '👤',
    };
    data.users.push(user);
    saveAllData(data);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    Object.assign(user, req.body);
    saveAllData(data);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const idx = data.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    data.users.splice(idx, 1);
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

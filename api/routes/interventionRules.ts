import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  getAllInterventionRules,
  createInterventionRule,
  updateInterventionRule,
  deleteInterventionRule,
} from '../services/businessService.js';
import type { InterventionRule } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const rules = getAllInterventionRules(data);
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Omit<InterventionRule, 'id'>;
    if (!body.triggerType) {
      return res.status(400).json({ success: false, error: 'triggerType 为必填' });
    }
    if (!body.actions || body.actions.length === 0) {
      return res.status(400).json({ success: false, error: 'actions 为必填且不能为空' });
    }
    const rule = createInterventionRule(data, body);
    saveAllData(data);
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const rule = updateInterventionRule(data, req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ success: false, error: '干预规则不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const ok = deleteInterventionRule(data, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: '干预规则不存在' });
    }
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

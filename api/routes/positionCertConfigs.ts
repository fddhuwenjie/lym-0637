import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  getAllPositionCertConfigs,
  createPositionCertConfig,
  updatePositionCertConfig,
  deletePositionCertConfig,
} from '../services/businessService.js';
import type { PositionCertConfig } from '../../shared/types.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const configs = getAllPositionCertConfigs(data);
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:positionId', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const config = data.positionCertConfigs.find(
      (c) => c.positionId === req.params.positionId
    );
    if (!config) {
      return res.status(404).json({ success: false, error: '该岗位未配置证书复核' });
    }
    const position = data.positions.find((p) => p.id === config.positionId);
    res.json({
      success: true,
      data: { ...config, positionName: position?.name },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const body = req.body as Omit<PositionCertConfig, 'id' | 'createdAt' | 'updatedAt'>;
    if (!body.positionId) {
      return res.status(400).json({ success: false, error: 'positionId 为必填' });
    }
    const exists = data.positionCertConfigs.some(
      (c) => c.positionId === body.positionId
    );
    if (exists) {
      return res.status(400).json({ success: false, error: '该岗位已有证书复核配置' });
    }
    const config = createPositionCertConfig(data, body);
    saveAllData(data);
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const config = updatePositionCertConfig(data, req.params.id, req.body);
    if (!config) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const ok = deletePositionCertConfig(data, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }
    saveAllData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

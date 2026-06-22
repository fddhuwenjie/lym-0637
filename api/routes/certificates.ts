import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  refreshAllCertificateStatuses,
  renewCertificate,
  getExamAttemptWithQuestions,
} from '../services/businessService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    refreshAllCertificateStatuses(data);
    const userId = req.query.userId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    let certs = data.certificates;
    if (userId) {
      certs = certs.filter((c) => c.userId === userId);
    }
    if (courseId) {
      certs = certs.filter((c) => c.courseId === courseId);
    }
    certs.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
    saveAllData(data);
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    refreshAllCertificateStatuses(data);
    const cert = data.certificates.find((c) => c.id === req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, error: '证书不存在' });
    }
    saveAllData(data);
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/:id/renew', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    refreshAllCertificateStatuses(data);
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId 为必填' });
    }
    const result = renewCertificate(data, req.params.id, userId);
    if (!result.ok) {
      return res.status(400).json({ success: false, error: result.reason });
    }
    saveAllData(data);
    const full = getExamAttemptWithQuestions(data, result.examAttempt!.id);
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

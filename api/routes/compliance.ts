import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import { getAllCompliance, getUserCompliance } from '../services/businessService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const user = data.users.find((u) => u.id === userId);
      if (!user) {
        return res.status(404).json({ success: false, error: '用户不存在' });
      }
      const record = getUserCompliance(data, userId);
      saveAllData(data);
      return res.json({ success: true, data: record });
    }
    const records = getAllCompliance(data);
    saveAllData(data);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/summary', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const records = getAllCompliance(data);
    const total = records.length;
    const compliant = records.filter((r) => r.isPositionCompliant).length;
    const withMissing = records.filter((r) => r.missingCourses.length > 0).length;
    const withExpired = records.filter((r) => r.expiredCertificates.length > 0).length;
    saveAllData(data);
    res.json({
      success: true,
      data: {
        totalEmployees: total,
        compliantCount: compliant,
        compliantRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        missingCoursesCount: withMissing,
        expiredCertificatesCount: withExpired,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

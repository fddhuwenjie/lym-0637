import express, { type Request, type Response } from 'express';
import { loadAllData, saveAllData } from '../services/dataStore.js';
import {
  refreshAllCertificateStatuses,
  generateReminders,
} from '../services/businessService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    refreshAllCertificateStatuses(data);
    generateReminders(data);
    const userId = req.query.userId as string | undefined;
    const acknowledged = req.query.acknowledged as string | undefined;
    let reminders = data.reminders;
    if (userId) {
      reminders = reminders.filter((r) => r.userId === userId);
    }
    if (acknowledged !== undefined) {
      reminders = reminders.filter(
        (r) => String(r.acknowledged) === acknowledged
      );
    }
    reminders.sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
    saveAllData(data);
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const data = loadAllData();
    const reminder = data.reminders.find((r) => r.id === req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, error: '提醒不存在' });
    }
    reminder.acknowledged = true;
    saveAllData(data);
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;

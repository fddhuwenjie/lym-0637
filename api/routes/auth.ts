import { Router, type Request, type Response } from 'express'
import { loadAllData } from '../services/dataStore.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  try {
    const data = loadAllData()
    const { userId } = req.body
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId 为必填' })
      return
    }
    const user = data.users.find((u) => u.id === userId)
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router

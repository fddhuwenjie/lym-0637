import { Router, type Request, type Response } from 'express'
import { loadAllData } from '../services/dataStore.js'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  try {
    const data = loadAllData()
    const { userId, name } = req.body
    let user: typeof data.users[0] | undefined

    if (userId) {
      user = data.users.find((u) => u.id === userId)
    } else if (name) {
      user = data.users.find((u) => u.name === name)
    }

    if (!userId && !name) {
      res.status(400).json({ success: false, error: 'userId 或 name 为必填' })
      return
    }
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: { user } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import courseRoutes from './routes/courses.js'
import questionRoutes from './routes/questions.js'
import positionRoutes from './routes/positions.js'
import enrollmentRoutes from './routes/enrollments.js'
import examRoutes from './routes/exams.js'
import certificateRoutes from './routes/certificates.js'
import reminderRoutes from './routes/reminders.js'
import complianceRoutes from './routes/compliance.js'
import exportRoutes from './routes/export.js'
import interventionRuleRoutes from './routes/interventionRules.js'
import positionCertConfigRoutes from './routes/positionCertConfigs.js'
import interventionTaskRoutes from './routes/interventionTasks.js'
import reviewRecordRoutes from './routes/reviewRecords.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/intervention-rules', interventionRuleRoutes)
app.use('/api/position-cert-configs', positionCertConfigRoutes)
app.use('/api/intervention-tasks', interventionTaskRoutes)
app.use('/api/review-records', reviewRecordRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app

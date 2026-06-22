import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import {
  interventionTaskApi,
  reviewRecordApi,
  exportApi,
} from '@/api'
import type {
  InterventionTask,
  InterventionTaskStatus,
  InterventionTriggerType,
  InterventionActionType,
  ReviewResult,
  CertificateRiskLevel,
} from '../../../shared/types'
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Pencil,
  Eye,
  AlertCircle,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TRIGGER_TYPE_META: Record<InterventionTriggerType, { label: string; icon: string }> = {
  cert_expiring: { label: '证书临期', icon: '⏰' },
  cert_expired: { label: '证书过期', icon: '❌' },
  exam_fail_repeated: { label: '多次考试未过', icon: '📝' },
  required_course_gap: { label: '必修课程缺口', icon: '📚' },
  required_cert_gap: { label: '必修证书缺口', icon: '🏅' },
}

const STATUS_META: Record<
  InterventionTaskStatus,
  { label: string; variant: 'default' | 'warning' | 'danger' | 'success' }
> = {
  pending: { label: '待处理', variant: 'warning' },
  in_progress: { label: '处理中', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
}

const ACTION_META: Record<InterventionActionType, string> = {
  notify: '发送通知',
  assign_course: '分配课程',
  assign_exam: '分配考试',
  manual_review: '人工审核',
  schedule_review: '安排复核',
}

export default function InterventionTasks() {
  const {
    interventionTasks,
    positions,
    users,
    positionCertConfigs,
    loadInterventionTasks,
    loadPositions,
    loadUsers,
    loadPositionCertConfigs,
    loadReviewRecords,
  } = useDataStore()

  const [filters, setFilters] = useState({
    positionId: '',
    status: '',
    triggerType: '',
  })
  const [detecting, setDetecting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<InterventionTask | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState<{
    result: ReviewResult
    comments: string
    nextReviewDate: string
  }>({
    result: 'pending',
    comments: '',
    nextReviewDate: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInterventionTasks()
    loadPositions()
    loadUsers()
    loadPositionCertConfigs()
    loadReviewRecords()
  }, [
    loadInterventionTasks,
    loadPositions,
    loadUsers,
    loadPositionCertConfigs,
    loadReviewRecords,
  ])

  const filteredTasks = useMemo(() => {
    return interventionTasks.filter((t) => {
      if (filters.positionId && t.positionId !== filters.positionId) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.triggerType && t.triggerType !== filters.triggerType) return false
      return true
    })
  }, [interventionTasks, filters])

  const stats = useMemo(() => {
    const total = interventionTasks.length
    const pending = interventionTasks.filter((t) => t.status === 'pending').length
    const inProgress = interventionTasks.filter((t) => t.status === 'in_progress').length
    const completed = interventionTasks.filter((t) => t.status === 'completed').length
    return { total, pending, inProgress, completed }
  }, [interventionTasks])

  const handleDetect = async () => {
    setDetecting(true)
    try {
      const res = await interventionTaskApi.detectAndGenerate()
      if (res.success) {
        alert(`成功生成 ${res.data?.generatedCount || 0} 条干预任务`)
        await loadInterventionTasks()
      } else {
        alert(res.error || '识别失败')
      }
    } finally {
      setDetecting(false)
    }
  }

  const openDetail = (task: InterventionTask) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const updateTaskStatus = async (taskId: string, status: InterventionTaskStatus) => {
    const res = await interventionTaskApi.updateTask(taskId, { status })
    if (res.success) {
      await loadInterventionTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask(res.data || null)
      }
    } else {
      alert(res.error || '更新失败')
    }
  }

  const addNote = async () => {
    if (!selectedTask || !noteInput.trim()) return
    const res = await interventionTaskApi.updateTask(selectedTask.id, {
      addNote: noteInput.trim(),
    })
    if (res.success) {
      setSelectedTask(res.data || null)
      setNoteInput('')
    } else {
      alert(res.error || '添加备注失败')
    }
  }

  const openReviewModal = (task: InterventionTask) => {
    setSelectedTask(task)
    setReviewForm({
      result: 'pending',
      comments: '',
      nextReviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    })
    setReviewModalOpen(true)
  }

  const handleCreateReview = async () => {
    if (!selectedTask) return
    const config = positionCertConfigs.find(
      (c) => c.positionId === selectedTask.positionId
    )
    const riskLevel: CertificateRiskLevel = config?.riskLevel || 'medium'

    const body: any = {
      userId: selectedTask.userId,
      positionId: selectedTask.positionId,
      certificateId: selectedTask.targetCertificateId,
      courseId: selectedTask.targetCourseId,
      reviewerId: undefined,
      reviewType: selectedTask.targetCertificateId ? 'certificate' : 'course',
      result: reviewForm.result,
      riskLevel,
      reviewDate: new Date().toISOString(),
      nextReviewDate: reviewForm.nextReviewDate
        ? new Date(reviewForm.nextReviewDate).toISOString()
        : undefined,
      comments: reviewForm.comments,
      taskId: selectedTask.id,
    }

    const res = await reviewRecordApi.createRecord(body)
    if (res.success) {
      await interventionTaskApi.updateTask(selectedTask.id, {
        status: reviewForm.result === 'pass' ? 'completed' : 'in_progress',
        addNote: `生成复核记录，结果：${reviewForm.result}`,
      })
      await loadInterventionTasks()
      await loadReviewRecords()
      setReviewModalOpen(false)
      alert('复核记录已创建')
    } else {
      alert(res.error || '创建失败')
    }
  }

  const handleExport = () => {
    exportApi.downloadExport('interventions')
  }

  const columns: TableColumn<InterventionTask>[] = [
    {
      key: 'priority',
      title: '优先级',
      dataIndex: 'priority',
      align: 'center',
      width: 80,
      render: (value) => {
        const p = value as number
        return (
          <span
            className={cn(
              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
              p >= 3
                ? 'bg-red-100 text-red-700 border border-red-200'
                : p === 2
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-sky-100 text-sky-700 border border-sky-200'
            )}
          >
            P{p}
          </span>
        )
      },
    },
    {
      key: 'trigger',
      title: '触发类型',
      dataIndex: 'triggerType',
      width: 140,
      render: (value) => {
        const meta = TRIGGER_TYPE_META[value as InterventionTriggerType]
        return (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <span>{meta.icon}</span>
            {meta.label}
          </span>
        )
      },
    },
    {
      key: 'user',
      title: '员工',
      dataIndex: 'userName',
      width: 100,
      render: (_, record) => {
        const u = users.find((us) => us.id === record.userId)
        return (
          <span className="inline-flex items-center gap-1.5">
            <span>{u?.avatar}</span>
            <span className="font-medium text-slate-700">{record.userName}</span>
          </span>
        )
      },
    },
    {
      key: 'position',
      title: '岗位',
      dataIndex: 'positionName',
      width: 110,
      render: (value) => (
        <span className="text-sm text-slate-600">{value || '-'}</span>
      ),
    },
    {
      key: 'desc',
      title: '触发说明',
      dataIndex: 'triggerDescription',
      render: (value) => (
        <span className="text-sm text-slate-700">{value as string}</span>
      ),
    },
    {
      key: 'assignedTo',
      title: '负责人',
      dataIndex: 'assignedToName',
      width: 100,
      render: (value) => {
        if (!value) return <span className="text-slate-400 text-sm">-</span>
        const u = users.find((us) => us.id === selectedTask?.assignedToId)
        return (
          <span className="inline-flex items-center gap-1 text-sm">
            <User size={12} className="text-slate-500" />
            <span className="text-slate-700">{value as string}</span>
          </span>
        )
      },
    },
    {
      key: 'dueDate',
      title: '截止日期',
      dataIndex: 'dueDate',
      align: 'center',
      width: 120,
      render: (value) => {
        if (!value) return <span className="text-slate-400 text-sm">-</span>
        const date = new Date(value as string)
        const isOverdue = date < new Date()
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'
            )}
          >
            <Clock size={12} />
            {date.toLocaleDateString('zh-CN')}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      width: 100,
      render: (value) => {
        const meta = STATUS_META[value as InterventionTaskStatus]
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => openDetail(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye size={15} />
          </button>
          {record.status === 'pending' && (
            <button
              onClick={() => updateTaskStatus(record.id, 'in_progress')}
              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="开始处理"
            >
              <Play size={15} />
            </button>
          )}
          {(record.status === 'pending' || record.status === 'in_progress') && (
            <>
              <button
                onClick={() => openReviewModal(record)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="创建复核记录"
              >
                <FileText size={15} />
              </button>
              <button
                onClick={() => updateTaskStatus(record.id, 'completed')}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="标记完成"
              >
                <CheckCircle2 size={15} />
              </button>
            </>
          )}
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <button
              onClick={() => {
                if (confirm('确定取消此任务？')) {
                  updateTaskStatus(record.id, 'cancelled')
                }
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="取消任务"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">学习干预任务</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm"
            >
              <Download size={16} />
              导出明细
            </button>
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={cn(detecting && 'animate-spin')} />
              {detecting ? '识别中...' : '智能识别生成'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500 mb-1">任务总数</div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-amber-400">
            <div className="text-sm text-slate-500 mb-1">待处理</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-sky-400">
            <div className="text-sm text-slate-500 mb-1">处理中</div>
            <div className="text-2xl font-bold text-sky-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-green-400">
            <div className="text-sm text-slate-500 mb-1">已完成</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">岗位：</label>
              <select
                value={filters.positionId}
                onChange={(e) =>
                  setFilters({ ...filters, positionId: e.target.value })
                }
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
              >
                <option value="">全部</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">状态：</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
              >
                <option value="">全部</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">
                触发类型：
              </label>
              <select
                value={filters.triggerType}
                onChange={(e) =>
                  setFilters({ ...filters, triggerType: e.target.value })
                }
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
              >
                <option value="">全部</option>
                {Object.entries(TRIGGER_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={filteredTasks} />
        </div>
      </div>

      <Modal
        open={detailOpen}
        title="干预任务详情"
        onClose={() => setDetailOpen(false)}
        onOk={() => setDetailOpen(false)}
        okText="关闭"
        hideCancel
        width={720}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">员工</div>
                <div className="font-medium text-slate-800">
                  {users.find((u) => u.id === selectedTask.userId)?.avatar}{' '}
                  {selectedTask.userName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">岗位</div>
                <div className="font-medium text-slate-800">
                  {selectedTask.positionName || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">触发类型</div>
                <div className="font-medium text-slate-800">
                  {TRIGGER_TYPE_META[selectedTask.triggerType].icon}{' '}
                  {TRIGGER_TYPE_META[selectedTask.triggerType].label}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <Badge
                  variant={STATUS_META[selectedTask.status].variant}
                >
                  {STATUS_META[selectedTask.status].label}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">关联课程</div>
                <div className="font-medium text-slate-800">
                  {selectedTask.targetCourseName || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">负责人</div>
                <div className="font-medium text-slate-800">
                  {selectedTask.assignedToName || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">截止日期</div>
                <div className="font-medium text-slate-800">
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString('zh-CN')
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">优先级</div>
                <div className="font-medium">
                  P{selectedTask.priority}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">触发说明</div>
              <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                {selectedTask.triggerDescription}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">需执行的干预动作</div>
              <div className="flex flex-wrap gap-2">
                {selectedTask.actions.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-full text-xs font-medium"
                  >
                    {ACTION_META[a]}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500 mb-2">跟进备注</div>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {selectedTask.notes.length === 0 ? (
                  <p className="text-sm text-slate-400">暂无备注</p>
                ) : (
                  selectedTask.notes.map((note, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 rounded-md text-sm text-slate-700"
                    >
                      {note}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="输入备注内容..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addNote()
                  }}
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={reviewModalOpen}
        title="创建复核记录"
        onClose={() => setReviewModalOpen(false)}
        onOk={handleCreateReview}
        okText={loading ? '保存中...' : '提交复核'}
        width={520}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-xs text-blue-600 mb-1">任务</div>
            <div className="text-sm font-medium text-blue-800">
              {selectedTask?.triggerDescription}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              员工：{selectedTask?.userName} | 课程：
              {selectedTask?.targetCourseName || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              复核结果 <span className="text-red-500">*</span>
            </label>
            <select
              value={reviewForm.result}
              onChange={(e) =>
                setReviewForm({
                  ...reviewForm,
                  result: e.target.value as ReviewResult,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            >
              <option value="pass">通过</option>
              <option value="fail">不通过</option>
              <option value="pending">待跟进</option>
              <option value="rescheduled">已安排重新复核</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              下次复核日期
            </label>
            <input
              type="date"
              value={reviewForm.nextReviewDate}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, nextReviewDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              复核意见
            </label>
            <textarea
              value={reviewForm.comments}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, comments: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] resize-none"
              placeholder="请输入复核意见..."
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

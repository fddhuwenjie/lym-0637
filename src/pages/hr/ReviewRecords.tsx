import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import { reviewRecordApi, exportApi } from '@/api'
import type {
  ReviewRecord,
  ReviewResult,
  CertificateRiskLevel,
} from '../../../shared/types'
import { Download, Eye, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal'

const RISK_META: Record<
  CertificateRiskLevel,
  { label: string; variant: 'default' | 'warning' | 'danger' | 'success' }
> = {
  low: { label: '低风险', variant: 'success' },
  medium: { label: '中风险', variant: 'default' },
  high: { label: '高风险', variant: 'warning' },
  critical: { label: '极高风险', variant: 'danger' },
}

const RESULT_META: Record<
  ReviewResult,
  { label: string; variant: 'default' | 'warning' | 'danger' | 'success' }
> = {
  pass: { label: '通过', variant: 'success' },
  fail: { label: '不通过', variant: 'danger' },
  pending: { label: '待跟进', variant: 'warning' },
  rescheduled: { label: '重新复核', variant: 'default' },
}

const REVIEW_TYPE_META: Record<string, string> = {
  certificate: '证书复核',
  course: '课程复核',
  exam: '考试复核',
  general: '综合复核',
}

export default function ReviewRecords() {
  const {
    reviewRecords,
    positions,
    users,
    loadReviewRecords,
    loadPositions,
    loadUsers,
  } = useDataStore()

  const [filters, setFilters] = useState({
    positionId: '',
    result: '',
    reviewType: '',
  })
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ReviewRecord | null>(null)

  useEffect(() => {
    loadReviewRecords()
    loadPositions()
    loadUsers()
  }, [loadReviewRecords, loadPositions, loadUsers])

  const filteredRecords = useMemo(() => {
    return reviewRecords.filter((r) => {
      if (filters.positionId && r.positionId !== filters.positionId) return false
      if (filters.result && r.result !== filters.result) return false
      if (filters.reviewType && r.reviewType !== filters.reviewType) return false
      return true
    })
  }, [reviewRecords, filters])

  const stats = useMemo(() => {
    const total = reviewRecords.length
    const pass = reviewRecords.filter((r) => r.result === 'pass').length
    const fail = reviewRecords.filter((r) => r.result === 'fail').length
    const pending = reviewRecords.filter((r) => r.result === 'pending').length
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0
    return { total, pass, fail, pending, passRate }
  }, [reviewRecords])

  const openDetail = (record: ReviewRecord) => {
    setSelectedRecord(record)
    setDetailOpen(true)
  }

  const handleExport = () => {
    exportApi.downloadExport('reviews')
  }

  const columns: TableColumn<ReviewRecord>[] = [
    {
      key: 'reviewDate',
      title: '复核日期',
      dataIndex: 'reviewDate',
      align: 'center',
      width: 120,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {new Date(value as string).toLocaleDateString('zh-CN')}
        </span>
      ),
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
      key: 'reviewType',
      title: '复核类型',
      dataIndex: 'reviewType',
      align: 'center',
      width: 100,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
          {REVIEW_TYPE_META[value as string] || value}
        </span>
      ),
    },
    {
      key: 'course',
      title: '关联内容',
      dataIndex: 'courseName',
      render: (value) => (
        <span className="text-sm text-slate-700">
          {(value as string) || '-'}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      dataIndex: 'riskLevel',
      align: 'center',
      width: 100,
      render: (value) => {
        const meta = RISK_META[value as CertificateRiskLevel]
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
    {
      key: 'reviewer',
      title: '复核人',
      dataIndex: 'reviewerName',
      width: 100,
      render: (value) => (
        <span className="text-sm text-slate-600">
          {(value as string) || '系统自动'}
        </span>
      ),
    },
    {
      key: 'result',
      title: '结果',
      dataIndex: 'result',
      align: 'center',
      width: 100,
      render: (value) => {
        const meta = RESULT_META[value as ReviewResult]
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
    {
      key: 'nextReview',
      title: '下次复核',
      dataIndex: 'nextReviewDate',
      align: 'center',
      width: 120,
      render: (value) => {
        if (!value) return <span className="text-slate-400 text-sm">-</span>
        return (
          <span className="text-sm text-slate-600">
            {new Date(value as string).toLocaleDateString('zh-CN')}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => openDetail(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">复核记录</h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm"
          >
            <Download size={16} />
            导出复核记录
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500 mb-1">复核总数</div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-green-400">
            <div className="text-sm text-slate-500 mb-1">通过</div>
            <div className="text-2xl font-bold text-green-600">{stats.pass}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-red-400">
            <div className="text-sm text-slate-500 mb-1">不通过</div>
            <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-amber-400">
            <div className="text-sm text-slate-500 mb-1">待跟进</div>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 border-l-4 border-l-sky-400">
            <div className="text-sm text-slate-500 mb-1">通过率</div>
            <div className="text-2xl font-bold text-sky-600">
              {stats.passRate}%
            </div>
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
              <label className="text-sm text-slate-600 whitespace-nowrap">结果：</label>
              <select
                value={filters.result}
                onChange={(e) =>
                  setFilters({ ...filters, result: e.target.value })
                }
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
              >
                <option value="">全部</option>
                {Object.entries(RESULT_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 whitespace-nowrap">
                复核类型：
              </label>
              <select
                value={filters.reviewType}
                onChange={(e) =>
                  setFilters({ ...filters, reviewType: e.target.value })
                }
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
              >
                <option value="">全部</option>
                {Object.entries(REVIEW_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={filteredRecords} />
        </div>
      </div>

      <Modal
        open={detailOpen}
        title="复核记录详情"
        onClose={() => setDetailOpen(false)}
        onOk={() => setDetailOpen(false)}
        okText="关闭"
        hideCancel
        width={640}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">复核日期</div>
                <div className="font-medium text-slate-800">
                  {new Date(selectedRecord.reviewDate).toLocaleDateString(
                    'zh-CN'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">复核类型</div>
                <div className="font-medium text-slate-800">
                  {REVIEW_TYPE_META[selectedRecord.reviewType] ||
                    selectedRecord.reviewType}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">员工</div>
                <div className="font-medium text-slate-800">
                  {users.find((u) => u.id === selectedRecord.userId)?.avatar}{' '}
                  {selectedRecord.userName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">岗位</div>
                <div className="font-medium text-slate-800">
                  {selectedRecord.positionName || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">风险等级</div>
                <Badge
                  variant={RISK_META[selectedRecord.riskLevel].variant}
                >
                  {RISK_META[selectedRecord.riskLevel].label}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">复核结果</div>
                <Badge variant={RESULT_META[selectedRecord.result].variant}>
                  {RESULT_META[selectedRecord.result].label}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">复核人</div>
                <div className="font-medium text-slate-800">
                  {selectedRecord.reviewerName || '系统自动'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">下次复核</div>
                <div className="font-medium text-slate-800">
                  {selectedRecord.nextReviewDate
                    ? new Date(
                        selectedRecord.nextReviewDate
                      ).toLocaleDateString('zh-CN')
                    : '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">关联课程</div>
                <div className="font-medium text-slate-800">
                  {selectedRecord.courseName || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">关联干预任务</div>
                <div className="font-medium text-slate-800">
                  {selectedRecord.taskId ? (
                    <span className="text-[#0ea5e9]">
                      {selectedRecord.taskId.slice(0, 12)}...
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">复核意见</div>
              <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                {selectedRecord.comments || '无'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}

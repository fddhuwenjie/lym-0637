import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import { exportApi } from '@/api'
import type { ExportHistory } from '../../../shared/types'
import {
  ClipboardCheck,
  FileText,
  Award,
  Bell,
  Download,
  AlertTriangle,
  History,
} from 'lucide-react'

const exportButtons = [
  {
    type: 'compliance',
    label: '岗位达标报告',
    icon: ClipboardCheck,
    description: '导出所有员工的岗位达标情况',
    variant: 'bg-[#1e3a5f] hover:bg-[#163049]',
  },
  {
    type: 'exams',
    label: '考试成绩报告',
    icon: FileText,
    description: '导出所有考试成绩明细',
    variant: 'bg-[#0ea5e9] hover:bg-[#0284c7]',
  },
  {
    type: 'certificates',
    label: '证书状态报告',
    icon: Award,
    description: '导出所有证书的有效期状态',
    variant: 'bg-[#10b981] hover:bg-[#059669]',
  },
  {
    type: 'reminders',
    label: '提醒记录',
    icon: Bell,
    description: '导出所有到期提醒记录',
    variant: 'bg-[#f59e0b] hover:bg-[#d97706]',
  },
  {
    type: 'interventions',
    label: '干预明细',
    icon: AlertTriangle,
    description: '导出学习干预任务明细',
    variant: 'bg-[#ef4444] hover:bg-[#dc2626]',
  },
  {
    type: 'reviews',
    label: '复核记录',
    icon: History,
    description: '导出证书与考试复核记录',
    variant: 'bg-[#8b5cf6] hover:bg-[#7c3aed]',
  },
  {
    type: 'positions',
    label: '岗位配置',
    icon: ClipboardCheck,
    description: '导出所有岗位配置信息',
    variant: 'bg-[#0891b2] hover:bg-[#0e7490]',
  },
  {
    type: 'courses',
    label: '课程数据',
    icon: FileText,
    description: '导出所有课程信息',
    variant: 'bg-[#059669] hover:bg-[#047857]',
  },
  {
    type: 'users',
    label: '用户数据',
    icon: Award,
    description: '导出所有用户信息',
    variant: 'bg-[#4f46e5] hover:bg-[#4338ca]',
  },
]

const getExportTypeLabel = (type: string) => {
  const btn = exportButtons.find((b) => b.type === type)
  return btn?.label || type
}

export default function DataExport() {
  const { exportHistory, loadExportHistory } = useDataStore()
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    loadExportHistory()
  }, [loadExportHistory])

  const handleExport = (type: string) => {
    setExporting(type)
    try {
      exportApi.downloadExport(type)
      setTimeout(() => {
        loadExportHistory()
        setExporting(null)
      }, 1000)
    } catch {
      alert('导出失败')
      setExporting(null)
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const columns: TableColumn<ExportHistory>[] = [
    {
      key: 'type',
      title: '报告类型',
      dataIndex: 'type',
      width: 160,
      render: (value) => (
        <Badge variant="info">{getExportTypeLabel(value as string)}</Badge>
      ),
    },
    {
      key: 'filename',
      title: '文件名',
      dataIndex: 'filename',
      render: (value) => (
        <span className="font-mono text-sm text-slate-700">{value as string}</span>
      ),
    },
    {
      key: 'createdBy',
      title: '操作人',
      dataIndex: 'createdBy',
      width: 120,
    },
    {
      key: 'createdAt',
      title: '导出时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value as string),
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 100,
      align: 'center',
      render: () => (
        <span className="text-xs text-slate-400">已归档</span>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">数据导出</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportButtons.map((btn) => {
            const Icon = btn.icon
            const isExporting = exporting === btn.type
            return (
              <button
                key={btn.type}
                onClick={() => handleExport(btn.type)}
                disabled={isExporting}
                className={`flex flex-col items-start p-5 rounded-lg text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${btn.variant}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={22} />
                  <span className="font-semibold text-base">{btn.label}</span>
                </div>
                <p className="text-xs text-white/80 mb-3 text-left">
                  {btn.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                  <Download size={14} />
                  {isExporting ? '导出中...' : '点击导出'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">
              导出历史
            </h3>
          </div>
          <Table columns={columns} data={exportHistory} />
        </div>
      </div>
    </AppLayout>
  )
}

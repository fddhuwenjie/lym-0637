import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import { useDataStore } from '@/stores/dataStore'
import { courseApi } from '@/api'
import type { Course } from '../../../shared/types'
import { Pencil } from 'lucide-react'

interface CertificateConfigForm {
  certificateValidDays: number
  reminderDays: number
}

export default function CertificateConfig() {
  const { courses, loadCourses } = useDataStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CertificateConfigForm>({
    certificateValidDays: 365,
    reminderDays: 30,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      certificateValidDays: course.certificateValidDays,
      reminderDays: course.reminderDays,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingCourse) return
    if (formData.certificateValidDays < 1) {
      alert('证书有效期必须大于0天')
      return
    }
    if (formData.reminderDays < 0) {
      alert('提醒天数不能小于0')
      return
    }
    if (formData.reminderDays >= formData.certificateValidDays) {
      alert('提醒天数必须小于证书有效期')
      return
    }
    setLoading(true)
    try {
      const res = await courseApi.updateCourse(editingCourse.id, formData)
      if (!res.success) {
        alert(res.error || '更新失败')
        return
      }
      await loadCourses()
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn<Course>[] = [
    { key: 'name', title: '课程名称', dataIndex: 'name' },
    {
      key: 'certificateValidDays',
      title: '证书有效期(天)',
      dataIndex: 'certificateValidDays',
      align: 'center',
      width: 140,
    },
    {
      key: 'reminderDays',
      title: '提前提醒(天)',
      dataIndex: 'reminderDays',
      align: 'center',
      width: 140,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => openEditModal(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="编辑"
          >
            <Pencil size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">证书配置</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={courses} />
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={`编辑证书配置 - ${editingCourse?.name || ''}`}
        onClose={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={loading ? '保存中...' : '保存'}
        width={480}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              证书有效期(天) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={formData.certificateValidDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  certificateValidDays: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">证书从颁发之日起多少天后过期</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              提前提醒(天) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.reminderDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reminderDays: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">在证书过期前多少天开始发送提醒</p>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

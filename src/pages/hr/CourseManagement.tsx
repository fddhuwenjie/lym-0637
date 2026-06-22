import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import { useDataStore } from '@/stores/dataStore'
import { courseApi } from '@/api'
import type { Course } from '../../../shared/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CourseFormData {
  name: string
  description: string
  content: string
  credit: number
  passingScore: number
  questionCount: number
  certificateValidDays: number
  reminderDays: number
}

const initialFormData: CourseFormData = {
  name: '',
  description: '',
  content: '',
  credit: 0,
  passingScore: 60,
  questionCount: 5,
  certificateValidDays: 365,
  reminderDays: 30,
}

export default function CourseManagement() {
  const { courses, loadCourses } = useDataStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CourseFormData>(initialFormData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const openCreateModal = () => {
    setEditingCourse(null)
    setFormData(initialFormData)
    setModalOpen(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description,
      content: course.content,
      credit: course.credit,
      passingScore: course.passingScore,
      questionCount: course.questionCount,
      certificateValidDays: course.certificateValidDays,
      reminderDays: course.reminderDays,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入课程名称')
      return
    }
    setLoading(true)
    try {
      if (editingCourse) {
        const res = await courseApi.updateCourse(editingCourse.id, formData)
        if (!res.success) {
          alert(res.error || '更新失败')
          return
        }
      } else {
        const res = await courseApi.createCourse(formData)
        if (!res.success) {
          alert(res.error || '创建失败')
          return
        }
      }
      await loadCourses()
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个课程吗？')) return
    const res = await courseApi.deleteCourse(id)
    if (res.success) {
      await loadCourses()
    } else {
      alert(res.error || '删除失败')
    }
  }

  const columns: TableColumn<Course>[] = [
    { key: 'name', title: '课程名称', dataIndex: 'name' },
    {
      key: 'credit',
      title: '学分',
      dataIndex: 'credit',
      align: 'center',
      width: 80,
    },
    {
      key: 'passingScore',
      title: '及格分',
      dataIndex: 'passingScore',
      align: 'center',
      width: 80,
    },
    {
      key: 'certificateValidDays',
      title: '有效期(天)',
      dataIndex: 'certificateValidDays',
      align: 'center',
      width: 100,
    },
    {
      key: 'questionCount',
      title: '题目数',
      dataIndex: 'questionCount',
      align: 'center',
      width: 80,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="编辑"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">课程管理</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm"
          >
            <Plus size={16} />
            新增课程
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={courses} />
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingCourse ? '编辑课程' : '新增课程'}
        onClose={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={loading ? '保存中...' : '保存'}
        width={640}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              课程名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              placeholder="请输入课程名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              课程描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none"
              placeholder="请输入课程描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              课程内容
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none"
              placeholder="请输入课程内容"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                学分
              </label>
              <input
                type="number"
                min={0}
                value={formData.credit}
                onChange={(e) => setFormData({ ...formData, credit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                及格分
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                题目数
              </label>
              <input
                type="number"
                min={1}
                value={formData.questionCount}
                onChange={(e) => setFormData({ ...formData, questionCount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                有效期(天)
              </label>
              <input
                type="number"
                min={1}
                value={formData.certificateValidDays}
                onChange={(e) => setFormData({ ...formData, certificateValidDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              提前提醒(天)
            </label>
            <input
              type="number"
              min={0}
              value={formData.reminderDays}
              onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import { useDataStore } from '@/stores/dataStore'
import { positionApi } from '@/api'
import type { Position } from '../../../shared/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface PositionFormData {
  name: string
  description: string
  maxRetakeCount: number
  requiredCourseIds: string[]
  requiredCertificateCourseIds: string[]
}

const initialFormData: PositionFormData = {
  name: '',
  description: '',
  maxRetakeCount: 2,
  requiredCourseIds: [],
  requiredCertificateCourseIds: [],
}

export default function PositionManagement() {
  const { positions, courses, loadPositions, loadCourses } = useDataStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [formData, setFormData] = useState<PositionFormData>(initialFormData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPositions()
    loadCourses()
  }, [loadPositions, loadCourses])

  const openCreateModal = () => {
    setEditingPosition(null)
    setFormData(initialFormData)
    setModalOpen(true)
  }

  const openEditModal = (position: Position) => {
    setEditingPosition(position)
    setFormData({
      name: position.name,
      description: position.description,
      maxRetakeCount: position.maxRetakeCount,
      requiredCourseIds: [...position.requiredCourseIds],
      requiredCertificateCourseIds: [...position.requiredCertificateCourseIds],
    })
    setModalOpen(true)
  }

  const toggleCourse = (courseId: string, field: 'requiredCourseIds' | 'requiredCertificateCourseIds') => {
    const current = formData[field]
    setFormData({
      ...formData,
      [field]: current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入岗位名称')
      return
    }
    setLoading(true)
    try {
      if (editingPosition) {
        const res = await positionApi.updatePosition(editingPosition.id, formData)
        if (!res.success) {
          alert(res.error || '更新失败')
          return
        }
      } else {
        const res = await positionApi.createPosition(formData)
        if (!res.success) {
          alert(res.error || '创建失败')
          return
        }
      }
      await loadPositions()
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个岗位吗？')) return
    const res = await positionApi.deletePosition(id)
    if (res.success) {
      await loadPositions()
    } else {
      alert(res.error || '删除失败')
    }
  }

  const getCourseNames = (ids: string[]) => {
    return ids
      .map((id) => courses.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join('、')
  }

  const columns: TableColumn<Position>[] = [
    { key: 'name', title: '岗位名称', dataIndex: 'name', width: 140 },
    {
      key: 'description',
      title: '描述',
      dataIndex: 'description',
    },
    {
      key: 'maxRetakeCount',
      title: '最大补考次数',
      dataIndex: 'maxRetakeCount',
      align: 'center',
      width: 120,
    },
    {
      key: 'requiredCourseIds',
      title: '必修课程',
      dataIndex: 'requiredCourseIds',
      render: (value) => {
        const ids = value as string[]
        return (
          <span className="text-sm text-slate-600">
            {getCourseNames(ids) || '-'}
          </span>
        )
      },
    },
    {
      key: 'requiredCertificateCourseIds',
      title: '所需证书课程',
      dataIndex: 'requiredCertificateCourseIds',
      render: (value) => {
        const ids = value as string[]
        return (
          <span className="text-sm text-slate-600">
            {getCourseNames(ids) || '-'}
          </span>
        )
      },
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
          <h2 className="text-xl font-semibold text-slate-800">岗位管理</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm"
          >
            <Plus size={16} />
            新增岗位
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={positions} />
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingPosition ? '编辑岗位' : '新增岗位'}
        onClose={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={loading ? '保存中...' : '保存'}
        width={640}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              岗位名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              placeholder="请输入岗位名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              岗位描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none"
              placeholder="请输入岗位描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              最大补考次数
            </label>
            <input
              type="number"
              min={0}
              value={formData.maxRetakeCount}
              onChange={(e) => setFormData({ ...formData, maxRetakeCount: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              必修课程（多选）
            </label>
            <div className="border border-slate-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-slate-400">暂无课程</p>
              ) : (
                courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.requiredCourseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id, 'requiredCourseIds')}
                      className="w-4 h-4 text-[#1e3a5f]"
                    />
                    <span className="text-sm">{course.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              所需证书课程（多选）
            </label>
            <div className="border border-slate-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-slate-400">暂无课程</p>
              ) : (
                courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.requiredCertificateCourseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id, 'requiredCertificateCourseIds')}
                      className="w-4 h-4 text-[#1e3a5f]"
                    />
                    <span className="text-sm">{course.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}

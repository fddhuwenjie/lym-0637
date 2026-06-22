import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import { questionApi } from '@/api'
import type { Question, QuestionType } from '../../../shared/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface QuestionFormData {
  courseId: string
  type: QuestionType
  content: string
  options: string[]
  correctAnswers: number[]
}

const initialFormData: QuestionFormData = {
  courseId: '',
  type: 'single',
  content: '',
  options: ['', '', '', ''],
  correctAnswers: [],
}

const questionTypeLabel: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
}

export default function QuestionBank() {
  const { questions, courses, loadQuestions, loadCourses } = useDataStore()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourses()
    loadQuestions(selectedCourseId || undefined)
  }, [loadCourses, loadQuestions, selectedCourseId])

  const filteredQuestions = selectedCourseId
    ? questions.filter((q) => q.courseId === selectedCourseId)
    : questions

  const openCreateModal = () => {
    setEditingQuestion(null)
    setFormData({
      ...initialFormData,
      courseId: selectedCourseId || (courses[0]?.id ?? ''),
      options: ['', '', '', ''],
      correctAnswers: [],
    })
    setModalOpen(true)
  }

  const openEditModal = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      courseId: question.courseId,
      type: question.type,
      content: question.content,
      options: [...question.options],
      correctAnswers: [...question.correctAnswers],
    })
    setModalOpen(true)
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] })
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return
    const newOptions = formData.options.filter((_, i) => i !== index)
    const newCorrect = formData.correctAnswers
      .filter((a) => a !== index)
      .map((a) => (a > index ? a - 1 : a))
    setFormData({ ...formData, options: newOptions, correctAnswers: newCorrect })
  }

  const toggleCorrectAnswer = (index: number) => {
    if (formData.type === 'single' || formData.type === 'judge') {
      setFormData({ ...formData, correctAnswers: [index] })
    } else {
      const exists = formData.correctAnswers.includes(index)
      setFormData({
        ...formData,
        correctAnswers: exists
          ? formData.correctAnswers.filter((a) => a !== index)
          : [...formData.correctAnswers, index],
      })
    }
  }

  const handleTypeChange = (type: QuestionType) => {
    const baseData = { ...formData, type }
    const wasJudge = formData.type === 'judge'
    if (type === 'judge') {
      baseData.options = ['正确', '错误']
      baseData.correctAnswers = []
    } else if (wasJudge) {
      baseData.options = ['', '', '', '']
      baseData.correctAnswers = []
    }
    setFormData(baseData)
  }

  const handleSubmit = async () => {
    if (!formData.courseId) {
      alert('请选择所属课程')
      return
    }
    if (!formData.content.trim()) {
      alert('请输入题干')
      return
    }
    if (formData.options.some((o) => !o.trim())) {
      alert('请填写所有选项')
      return
    }
    if (formData.correctAnswers.length === 0) {
      alert('请选择正确答案')
      return
    }

    setLoading(true)
    try {
      if (editingQuestion) {
        const updatePayload = {
          courseId: formData.courseId,
          type: formData.type,
          content: formData.content,
          options: formData.options,
          correctAnswers: formData.correctAnswers,
        }
        const res = await questionApi.updateQuestion(editingQuestion.id, updatePayload)
        if (!res.success) {
          alert(res.error || '更新失败')
          return
        }
      } else {
        const createPayload = {
          courseId: formData.courseId,
          type: formData.type,
          content: formData.content,
          options: formData.options,
          correctAnswers: formData.correctAnswers,
          version: 1,
        }
        const res = await questionApi.createQuestion(createPayload)
        if (!res.success) {
          alert(res.error || '创建失败')
          return
        }
      }
      await loadQuestions(selectedCourseId || undefined)
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个题目吗？')) return
    const res = await questionApi.deleteQuestion(id)
    if (res.success) {
      await loadQuestions(selectedCourseId || undefined)
    } else {
      alert(res.error || '删除失败')
    }
  }

  const columns: TableColumn<Question>[] = [
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type',
      width: 100,
      align: 'center',
      render: (value) => {
        const type = value as QuestionType
        const variant =
          type === 'single'
            ? 'info'
            : type === 'multiple'
            ? 'default'
            : 'success'
        return <Badge variant={variant}>{questionTypeLabel[type]}</Badge>
      },
    },
    { key: 'content', title: '题干', dataIndex: 'content' },
    {
      key: 'version',
      title: '版本号',
      dataIndex: 'version',
      width: 100,
      align: 'center',
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
          <h2 className="text-xl font-semibold text-slate-800">题库管理</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm"
          >
            <Plus size={16} />
            新增题目
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-600">按课程筛选：</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent min-w-[200px]"
            >
              <option value="">全部课程</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={filteredQuestions} />
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={
          editingQuestion
            ? `编辑题目 (版本号将自动+1)`
            : '新增题目'
        }
        onClose={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={loading ? '保存中...' : '保存'}
        width={640}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              所属课程 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
            >
              <option value="">请选择课程</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              题目类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {(['single', 'multiple', 'judge'] as QuestionType[]).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={() => handleTypeChange(type)}
                    className="w-4 h-4 text-[#1e3a5f]"
                  />
                  <span className="text-sm">{questionTypeLabel[type]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              题干 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none"
              placeholder="请输入题干内容"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                选项 <span className="text-red-500">*</span>
                {formData.type !== 'judge' && (
                  <span className="text-xs text-slate-500 ml-2">
                    （点击复选框标记为正确答案）
                  </span>
                )}
              </label>
              {formData.type !== 'judge' && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-[#0ea5e9] hover:underline"
                >
                  + 添加选项
                </button>
              )}
            </div>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={formData.type === 'multiple' ? 'checkbox' : 'radio'}
                    name="correct"
                    checked={formData.correctAnswers.includes(index)}
                    onChange={() => toggleCorrectAnswer(index)}
                    className="w-4 h-4 text-[#1e3a5f]"
                  />
                  <span className="text-sm text-slate-500 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    disabled={formData.type === 'judge'}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent disabled:bg-slate-100"
                    placeholder="请输入选项内容"
                  />
                  {formData.type !== 'judge' && formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除选项"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingQuestion && (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md">
              当前版本号：v{editingQuestion.version}，保存后将自动变为 v{editingQuestion.version + 1}
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import type { ExamAttempt } from '../../../shared/types'

export default function ExamRecords() {
  const {
    exams,
    users,
    courses,
    loadExams,
    loadUsers,
    loadCourses,
  } = useDataStore()

  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  useEffect(() => {
    loadExams()
    loadUsers()
    loadCourses()
  }, [loadExams, loadUsers, loadCourses])

  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => e.submitted)
      .filter((e) => (selectedUserId ? e.userId === selectedUserId : true))
      .filter((e) => (selectedCourseId ? e.courseId === selectedCourseId : true))
      .sort(
        (a, b) =>
          new Date(b.submittedAt || b.startedAt).getTime() -
          new Date(a.submittedAt || a.startedAt).getTime()
      )
  }, [exams, selectedUserId, selectedCourseId])

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || userId
  }

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.name || courseId
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const columns: TableColumn<ExamAttempt>[] = [
    {
      key: 'userName',
      title: '员工',
      dataIndex: 'userId',
      width: 120,
      render: (value) => getUserName(value as string),
    },
    {
      key: 'courseName',
      title: '课程',
      dataIndex: 'courseId',
      render: (value) => getCourseName(value as string),
    },
    {
      key: 'score',
      title: '分数',
      dataIndex: 'score',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <span
          className={`font-medium ${
            record.passed ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {value as number}
        </span>
      ),
    },
    {
      key: 'passed',
      title: '是否通过',
      dataIndex: 'passed',
      width: 100,
      align: 'center',
      render: (value) =>
        value ? (
          <Badge variant="success">通过</Badge>
        ) : (
          <Badge variant="danger">未通过</Badge>
        ),
    },
    {
      key: 'attemptNumber',
      title: '第几次考试',
      dataIndex: 'attemptNumber',
      width: 100,
      align: 'center',
      render: (value) => `第 ${value} 次`,
    },
    {
      key: 'submittedAt',
      title: '考试时间',
      dataIndex: 'submittedAt',
      width: 180,
      render: (value) => formatDateTime(value as string | null),
    },
    {
      key: 'questionVersion',
      title: '题库版本',
      dataIndex: 'questionVersion',
      width: 100,
      align: 'center',
      render: (value) => `v${value}`,
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">考试明细</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">员工：</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent min-w-[160px]"
              >
                <option value="">全部员工</option>
                {users
                  .filter((u) => u.role === 'employee')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">课程：</label>
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <Table columns={columns} data={filteredExams} />
        </div>
      </div>
    </AppLayout>
  )
}

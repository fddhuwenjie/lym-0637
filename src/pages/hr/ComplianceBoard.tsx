import { useEffect, useMemo } from 'react'
import AppLayout from '@/components/AppLayout'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import type { ComplianceRecord, CertificateStatus } from '../../../shared/types'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

type CourseStatus = 'completed' | 'in_progress' | 'not_started'

interface EmployeeComplianceRow {
  compliance: ComplianceRecord
  courseStatuses: Record<string, CourseStatus>
  certificateStatuses: Record<string, CertificateStatus | 'missing'>
}

export default function ComplianceBoard() {
  const {
    compliance,
    positions,
    courses,
    enrollments,
    certificates,
    loadCompliance,
    loadPositions,
    loadCourses,
    loadEnrollments,
    loadCertificates,
  } = useDataStore()

  useEffect(() => {
    loadCompliance()
    loadPositions()
    loadCourses()
    loadEnrollments()
    loadCertificates()
  }, [
    loadCompliance,
    loadPositions,
    loadCourses,
    loadEnrollments,
    loadCertificates,
  ])

  const rows: EmployeeComplianceRow[] = useMemo(() => {
    return compliance.map((comp) => {
      const courseStatuses: Record<string, CourseStatus> = {}
      const certificateStatuses: Record<string, CertificateStatus | 'missing'> = {}

      const position = positions.find((p) => p.id === comp.positionId)
      const requiredCourseIds = position?.requiredCourseIds ?? []
      const requiredCertCourseIds = position?.requiredCertificateCourseIds ?? []

      requiredCourseIds.forEach((courseId) => {
        const enrollment = enrollments.find(
          (e) => e.userId === comp.userId && e.courseId === courseId
        )
        if (!enrollment) {
          courseStatuses[courseId] = 'not_started'
        } else if (enrollment.progress >= 100) {
          courseStatuses[courseId] = 'completed'
        } else {
          courseStatuses[courseId] = 'in_progress'
        }
      })

      requiredCertCourseIds.forEach((courseId) => {
        const cert = certificates.find(
          (c) => c.userId === comp.userId && c.courseId === courseId
        )
        if (!cert) {
          certificateStatuses[courseId] = 'missing'
        } else {
          certificateStatuses[courseId] = cert.status
        }
      })

      return {
        compliance: comp,
        courseStatuses,
        certificateStatuses,
      }
    })
  }, [compliance, positions, enrollments, certificates])

  const getCourseStatusStyle = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-amber-100 text-amber-700'
      case 'not_started':
        return 'bg-red-100 text-red-700'
    }
  }

  const getCourseStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'in_progress':
        return '学习中'
      case 'not_started':
        return '未开始'
    }
  }

  const getCertificateStatusStyle = (status: CertificateStatus | 'missing') => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700'
      case 'expiring':
        return 'bg-amber-100 text-amber-700'
      case 'expired':
      case 'missing':
        return 'bg-red-100 text-red-700'
    }
  }

  const getCertificateStatusLabel = (status: CertificateStatus | 'missing') => {
    switch (status) {
      case 'valid':
        return '有效'
      case 'expiring':
        return '即将到期'
      case 'expired':
        return '已过期'
      case 'missing':
        return '未获取'
    }
  }

  const hasAnomaly = (row: EmployeeComplianceRow) => {
    const hasCourseIssue = Object.values(row.courseStatuses).some(
      (s) => s !== 'completed'
    )
    const hasCertIssue = Object.values(row.certificateStatuses).some(
      (s) => s !== 'valid'
    )
    return hasCourseIssue || hasCertIssue
  }

  const allCourseIds = useMemo(() => {
    const ids = new Set<string>()
    positions.forEach((p) => {
      p.requiredCourseIds.forEach((id) => ids.add(id))
      p.requiredCertificateCourseIds.forEach((id) => ids.add(id))
    })
    return Array.from(ids)
  }, [positions])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">员工达标看板</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium sticky left-0 bg-slate-50 z-10">
                    员工
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    岗位
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    必修课程完成情况
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    证书有效性
                  </th>
                  <th className="px-4 py-3 text-center font-medium w-24">
                    综合状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const anomaly = hasAnomaly(row)
                    return (
                      <tr
                        key={row.compliance.userId}
                        className={cn(
                          'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                          anomaly && 'bg-red-50/50'
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-inherit z-10">
                          {row.compliance.userName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.compliance.positionName || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {Object.keys(row.courseStatuses).length === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(row.courseStatuses).map(
                                ([courseId, status]) => {
                                  const course = courses.find(
                                    (c) => c.id === courseId
                                  )
                                  const isAbnormal = status !== 'completed'
                                  return (
                                    <span
                                      key={courseId}
                                      className={cn(
                                        'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                        getCourseStatusStyle(status)
                                      )}
                                      title={
                                        course?.name +
                                        ': ' +
                                        getCourseStatusLabel(status)
                                      }
                                    >
                                      {isAbnormal && (
                                        <AlertCircle
                                          size={12}
                                          className="mr-1"
                                        />
                                      )}
                                      {course?.name || courseId}
                                    </span>
                                  )
                                }
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {Object.keys(row.certificateStatuses).length === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(row.certificateStatuses).map(
                                ([courseId, status]) => {
                                  const course = courses.find(
                                    (c) => c.id === courseId
                                  )
                                  const isAbnormal = status !== 'valid'
                                  return (
                                    <span
                                      key={courseId}
                                      className={cn(
                                        'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                        getCertificateStatusStyle(status)
                                      )}
                                      title={
                                        course?.name +
                                        ': ' +
                                        getCertificateStatusLabel(status)
                                      }
                                    >
                                      {isAbnormal && (
                                        <AlertCircle
                                          size={12}
                                          className="mr-1"
                                        />
                                      )}
                                      {course?.name || courseId}
                                    </span>
                                  )
                                }
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.compliance.isPositionCompliant ? (
                            <Badge variant="success" className="inline-flex items-center gap-1">
                              <CheckCircle size={12} />
                              达标
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="inline-flex items-center gap-1">
                              <XCircle size={12} />
                              未达标
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">图例说明</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span className="text-slate-600">正常/已完成/有效</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-slate-600">学习中/即将到期</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span className="text-slate-600">未开始/已过期/未获取</span>
            </div>
          </div>
        </div>

        <div className="sr-only">
          {allCourseIds}
        </div>
      </div>
    </AppLayout>
  )
}

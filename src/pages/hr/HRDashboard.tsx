import { useEffect, useMemo } from 'react'
import AppLayout from '@/components/AppLayout'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import {
  Users,
  Award,
  FileCheck,
  BookOpen,
  AlertTriangle,
  Clock,
} from 'lucide-react'

export default function HRDashboard() {
  const {
    compliance,
    certificates,
    exams,
    enrollments,
    positions,
    reminders,
    loadCompliance,
    loadCertificates,
    loadExams,
    loadEnrollments,
    loadPositions,
    loadReminders,
  } = useDataStore()

  useEffect(() => {
    loadCompliance()
    loadCertificates()
    loadExams()
    loadEnrollments()
    loadPositions()
    loadReminders()
  }, [
    loadCompliance,
    loadCertificates,
    loadExams,
    loadEnrollments,
    loadPositions,
    loadReminders,
  ])

  const stats = useMemo(() => {
    const totalEmployees = compliance.length
    const compliantEmployees = compliance.filter((c) => c.isPositionCompliant).length
    const employeeComplianceRate =
      totalEmployees > 0 ? Math.round((compliantEmployees / totalEmployees) * 100) : 0

    const expiringCount = certificates.filter(
      (c) => c.status === 'expiring' || c.status === 'expired'
    ).length

    const submittedExams = exams.filter((e) => e.submitted)
    const passedExams = submittedExams.filter((e) => e.passed)
    const examPassRate =
      submittedExams.length > 0
        ? Math.round((passedExams.length / submittedExams.length) * 100)
        : 0

    const completedEnrollments = enrollments.filter((e) => e.progress === 100)
    const courseCompletionRate =
      enrollments.length > 0
        ? Math.round((completedEnrollments.length / enrollments.length) * 100)
        : 0

    return {
      employeeComplianceRate: `${employeeComplianceRate}%`,
      expiringCount,
      examPassRate: `${examPassRate}%`,
      courseCompletionRate: `${courseCompletionRate}%`,
    }
  }, [compliance, certificates, exams, enrollments])

  const recentReminders = useMemo(() => {
    return [...reminders]
      .sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      )
      .slice(0, 5)
  }, [reminders])

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'expiring_30d':
        return { label: '即将到期(30天)', variant: 'warning' as const }
      case 'expiring_7d':
        return { label: '即将到期(7天)', variant: 'danger' as const }
      case 'expired':
        return { label: '已过期', variant: 'danger' as const }
      default:
        return { label: type, variant: 'default' as const }
    }
  }

  const positionComplianceOverview = useMemo(() => {
    return positions.map((pos) => {
      const positionCompliance = compliance.filter((c) => c.positionId === pos.id)
      const compliantCount = positionCompliance.filter((c) => c.isPositionCompliant).length
      const total = positionCompliance.length
      const rate = total > 0 ? Math.round((compliantCount / total) * 100) : 0
      return {
        id: pos.id,
        name: pos.name,
        total,
        compliantCount,
        rate,
      }
    })
  }, [positions, compliance])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="员工达标率"
            value={stats.employeeComplianceRate}
            icon={Users}
            variant="default"
            trend={`${compliance.filter(c => c.isPositionCompliant).length}/${compliance.length} 人达标`}
          />
          <StatCard
            title="即将到期证书数"
            value={stats.expiringCount}
            icon={Award}
            variant="warning"
            trend="需关注续期"
          />
          <StatCard
            title="考试通过率"
            value={stats.examPassRate}
            icon={FileCheck}
            variant="success"
            trend={`${exams.filter(e => e.submitted && e.passed).length}/${exams.filter(e => e.submitted).length} 次考试通过`}
          />
          <StatCard
            title="课程完成率"
            value={stats.courseCompletionRate}
            icon={BookOpen}
            variant="default"
            trend={`${enrollments.filter(e => e.progress === 100).length}/${enrollments.length} 门课程完成`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-[#0ea5e9]" />
                最近提醒
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentReminders.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">
                  暂无提醒
                </div>
              ) : (
                recentReminders.map((reminder) => {
                  const typeInfo = getReminderTypeLabel(reminder.type)
                  return (
                    <div
                      key={reminder.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          size={18}
                          className={
                            reminder.type === 'expired'
                              ? 'text-red-500'
                              : 'text-amber-500'
                          }
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            证书提醒
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(reminder.sentAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-[#0ea5e9]" />
                岗位达标概览
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {positionComplianceOverview.length === 0 ? (
                <div className="text-center text-slate-500 py-8">暂无岗位数据</div>
              ) : (
                positionComplianceOverview.map((pos) => (
                  <div key={pos.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-700 font-medium">{pos.name}</span>
                      <span className="text-slate-500">
                        {pos.compliantCount}/{pos.total} 人 ({pos.rate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pos.rate >= 80
                            ? 'bg-[#10b981]'
                            : pos.rate >= 50
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#ef4444]'
                        }`}
                        style={{ width: `${pos.rate}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

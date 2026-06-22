import { useEffect, useMemo } from 'react';
import {
  BookOpen,
  FileCheck,
  Award,
  Bell,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Empty from '@/components/Empty';
import AppLayout from '@/components/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import type { Certificate, Enrollment } from '../../../shared/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EmpDashboard() {
  const { user } = useAuthStore();
  const {
    courses,
    enrollments,
    exams,
    certificates,
    positions,
    reminders,
    loadCourses,
    loadEnrollments,
    loadExams,
    loadCertificates,
    loadPositions,
    loadReminders,
  } = useDataStore();

  useEffect(() => {
    if (user?.id) {
      loadCourses();
      loadEnrollments(user.id);
      loadExams(user.id);
      loadCertificates(user.id);
      loadPositions();
      loadReminders(user.id);
    }
  }, [user?.id, loadCourses, loadEnrollments, loadExams, loadCertificates, loadPositions, loadReminders]);

  const userEnrollments = useMemo(
    () => enrollments.filter((e) => e.userId === user?.id),
    [enrollments, user?.id]
  );

  const userExams = useMemo(
    () => exams.filter((e) => e.userId === user?.id),
    [exams, user?.id]
  );

  const userCertificates = useMemo(
    () => certificates.filter((c) => c.userId === user?.id),
    [certificates, user?.id]
  );

  const userReminders = useMemo(
    () => reminders.filter((r) => r.userId === user?.id && !r.acknowledged),
    [reminders, user?.id]
  );

  const completedCoursesCount = useMemo(() => {
    return userEnrollments.filter((e) => e.progress === 100).length;
  }, [userEnrollments]);

  const passedExamsCount = useMemo(() => {
    return userExams.filter((e) => e.passed && e.submitted).length;
  }, [userExams]);

  const validCertificatesCount = useMemo(() => {
    return userCertificates.filter((c) => c.status === 'valid').length;
  }, [userCertificates]);

  const pendingRemindersCount = userReminders.length;

  const userPosition = useMemo(() => {
    if (!user?.positionId) return null;
    return positions.find((p) => p.id === user.positionId) || null;
  }, [user?.positionId, positions]);

  const positionCompliance = useMemo(() => {
    if (!userPosition) return null;

    const requiredCourseIds = userPosition.requiredCourseIds;
    const requiredCertCourseIds = userPosition.requiredCertificateCourseIds;

    const courseProgress: { courseId: string; courseName: string; progress: number; completed: boolean }[] = [];

    requiredCourseIds.forEach((courseId) => {
      const course = courses.find((c) => c.id === courseId);
      const enrollment = userEnrollments.find((e) => e.courseId === courseId);
      courseProgress.push({
        courseId,
        courseName: course?.name || courseId,
        progress: enrollment?.progress || 0,
        completed: (enrollment?.progress || 0) === 100,
      });
    });

    const certificateStatus: { courseId: string; courseName: string; hasValid: boolean; expiry?: string }[] = [];

    requiredCertCourseIds.forEach((courseId) => {
      const course = courses.find((c) => c.id === courseId);
      const cert = userCertificates.find(
        (c) => c.courseId === courseId && c.status === 'valid'
      );
      certificateStatus.push({
        courseId,
        courseName: course?.name || courseId,
        hasValid: !!cert,
        expiry: cert?.expiresAt,
      });
    });

    const totalRequirements = requiredCourseIds.length + requiredCertCourseIds.length;
    const metRequirements =
      courseProgress.filter((c) => c.completed).length +
      certificateStatus.filter((c) => c.hasValid).length;

    const isFullyCompliant = totalRequirements > 0 && metRequirements === totalRequirements;

    return {
      isFullyCompliant,
      totalRequirements,
      metRequirements,
      courseProgress,
      certificateStatus,
    };
  }, [userPosition, courses, userEnrollments, userCertificates]);

  const expiringCertificates = useMemo(() => {
    return userCertificates
      .filter((c) => c.status === 'expiring' || c.status === 'expired')
      .sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.expiresAt);
        const daysB = getDaysUntilExpiry(b.expiresAt);
        return daysA - daysB;
      });
  }, [userCertificates]);

  const learningProgress = useMemo(() => {
    if (userEnrollments.length === 0) return null;
    const totalProgress = userEnrollments.reduce((sum, e) => sum + e.progress, 0);
    const avgProgress = Math.round(totalProgress / userEnrollments.length);
    return avgProgress;
  }, [userEnrollments]);

  const getCourseName = (courseId: string): string => {
    return courses.find((c) => c.id === courseId)?.name || courseId;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              欢迎回来，{user?.name || '用户'}
            </h2>
            <p className="text-gray-500 mt-1">
              {userPosition ? `${userPosition.name}` : '查看您的学习进度和证书状态'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="已完成课程"
            value={completedCoursesCount}
            icon={BookOpen}
            variant="default"
            trend={`共报名 ${userEnrollments.length} 门课程`}
          />
          <StatCard
            title="通过考试"
            value={passedExamsCount}
            icon={FileCheck}
            variant="success"
            trend={`共参加 ${userExams.filter((e) => e.submitted).length} 次考试`}
          />
          <StatCard
            title="有效证书"
            value={validCertificatesCount}
            icon={Award}
            variant="warning"
            trend={`共获得 ${userCertificates.length} 张证书`}
          />
          <StatCard
            title="待处理提醒"
            value={pendingRemindersCount}
            icon={Bell}
            variant="danger"
            trend={pendingRemindersCount > 0 ? '请及时处理' : '暂无待办'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">岗位达标状态</h3>
                {positionCompliance && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                      positionCompliance.isFullyCompliant
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {positionCompliance.isFullyCompliant ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {positionCompliance.isFullyCompliant ? '已达标' : '未完全达标'}
                  </span>
                )}
              </div>

              {!userPosition ? (
                <div className="h-40">
                  <Empty />
                </div>
              ) : positionCompliance ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">整体达标进度</span>
                        <span className="font-semibold text-gray-900">
                          {positionCompliance.metRequirements}/{positionCompliance.totalRequirements}
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            positionCompliance.isFullyCompliant
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          )}
                          style={{
                            width: `${positionCompliance.totalRequirements > 0 ? (positionCompliance.metRequirements / positionCompliance.totalRequirements) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {positionCompliance.courseProgress.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">必修课程进度</h4>
                      <div className="space-y-3">
                        {positionCompliance.courseProgress.map((cp) => (
                          <div key={cp.courseId} className="flex items-center gap-3">
                            {cp.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-700 truncate">{cp.courseName}</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {cp.progress}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    cp.completed ? 'bg-emerald-500' : 'bg-blue-500'
                                  )}
                                  style={{ width: `${cp.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {positionCompliance.certificateStatus.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">必备证书状态</h4>
                      <div className="space-y-2">
                        {positionCompliance.certificateStatus.map((cs) => (
                          <div
                            key={cs.courseId}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {cs.hasValid ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                              <span className="text-sm text-gray-700">{cs.courseName}</span>
                            </div>
                            <span
                              className={cn(
                                'text-xs font-medium px-2 py-1 rounded-md',
                                cs.hasValid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              )}
                            >
                              {cs.hasValid
                                ? cs.expiry
                                  ? `有效期至 ${formatDate(cs.expiry)}`
                                  : '有效'
                                : '未获得'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">学习进度总览</h3>
              </div>

              {userEnrollments.length === 0 ? (
                <div className="h-40">
                  <Empty />
                </div>
              ) : (
                <div className="space-y-4">
                  {learningProgress !== null && (
                    <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-blue-100"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${learningProgress * 1.76} 176`}
                            strokeLinecap="round"
                            className="text-blue-500"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-600">
                          {learningProgress}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">平均学习进度</p>
                        <p className="text-lg font-semibold text-gray-900">
                          已学习 {userEnrollments.filter((e) => e.progress > 0).length}/
                          {userEnrollments.length} 门课程
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {userEnrollments.map((enrollment: Enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getCourseName(enrollment.courseId)}
                            </p>
                            <p className="text-xs text-gray-500">
                              报名于 {formatDate(enrollment.enrolledAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">进度</span>
                              <span className="font-semibold text-gray-700">
                                {enrollment.progress}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  enrollment.progress === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-500'
                                )}
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">即将到期证书</h3>
                <span className="text-xs text-gray-500">共 {expiringCertificates.length} 张</span>
              </div>

              {expiringCertificates.length === 0 ? (
                <div className="py-8 text-center">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">暂无即将到期的证书</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringCertificates.slice(0, 5).map((cert: Certificate) => {
                    const days = getDaysUntilExpiry(cert.expiresAt);
                    const isExpired = cert.status === 'expired' || days <= 0;
                    return (
                      <div
                        key={cert.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          isExpired
                            ? 'bg-rose-50 border-rose-200'
                            : days <= 7
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-amber-50/50 border-amber-200/50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getCourseName(cert.courseId)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              版本 {cert.version}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-md ml-2 flex-shrink-0',
                              isExpired
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            {isExpired ? '已过期' : `${days}天后到期`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          到期日期：{formatDate(cert.expiresAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {pendingRemindersCount > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">待处理提醒</h3>
                  <Bell className="h-5 w-5 text-rose-500" />
                </div>
                <div className="space-y-3">
                  {userReminders.slice(0, 5).map((reminder) => {
                    const cert = userCertificates.find((c) => c.id === reminder.certificateId);
                    let label = '';
                    let colorClass = '';
                    switch (reminder.type) {
                      case 'expiring_30d':
                        label = '30天内到期';
                        colorClass = 'bg-amber-100 text-amber-700';
                        break;
                      case 'expiring_7d':
                        label = '7天内到期';
                        colorClass = 'bg-orange-100 text-orange-700';
                        break;
                      case 'expired':
                        label = '已过期';
                        colorClass = 'bg-rose-100 text-rose-700';
                        break;
                    }
                    return (
                      <div
                        key={reminder.id}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">
                              证书「{cert ? getCourseName(cert.courseId) : '未知课程'}」
                              <span className={cn('ml-1 px-1.5 py-0.5 rounded text-xs', colorClass)}>
                                {label}
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(reminder.sentAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Award,
  PlayCircle,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import Empty from '@/components/Empty';
import AppLayout from '@/components/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import { enrollmentApi } from '@/api';
import type { Course, Enrollment } from '../../../shared/types';

type TabType = 'available' | 'enrolled';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  type: TabType;
  onEnroll?: (courseId: string) => void;
  onLearn?: (enrollmentId: string) => void;
  onTakeExam?: (courseId: string) => void;
  enrolling?: boolean;
  learning?: boolean;
}

function CourseCard({
  course,
  enrollment,
  type,
  onEnroll,
  onLearn,
  onTakeExam,
  enrolling,
  learning,
}: CourseCardProps) {
  const navigate = useNavigate();
  const isCompleted = enrollment?.progress === 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
            <Award className="h-3 w-3" />
            {course.credit} 学分
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      <div className="p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
          {course.name}
        </h4>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <FileCheck className="h-3.5 w-3.5" />
            {course.questionCount} 题
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            及格分 {course.passingScore}
          </span>
        </div>

        {type === 'enrolled' && enrollment && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">学习进度</span>
              <span
                className={cn(
                  'font-semibold',
                  isCompleted ? 'text-emerald-600' : 'text-blue-600'
                )}
              >
                {enrollment.progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                )}
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              报名于 {formatDate(enrollment.enrolledAt)}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {type === 'available' ? (
            <button
              onClick={() => onEnroll?.(course.id)}
              disabled={enrolling}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                enrolling
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98'
              )}
            >
              {enrolling ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  报名中...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  报名课程
                </>
              )}
            </button>
          ) : (
            <>
              {!isCompleted ? (
                <button
                  onClick={() => onLearn?.(enrollment!.id)}
                  disabled={learning}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    learning
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98'
                  )}
                >
                  {learning ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      学习中...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      继续学习
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onTakeExam?.(course.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors active:scale-98"
                >
                  <FileCheck className="h-4 w-4" />
                  参加考试
                </button>
              )}
              {!isCompleted && (
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                  title="请先完成学习再参加考试"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">参加考试</span>
                </button>
              )}
            </>
          )}
        </div>

        {type === 'enrolled' && !isCompleted && (
          <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            完成学习进度 100% 后方可参加考试
          </p>
        )}

        {type === 'enrolled' && isCompleted && enrollment?.completedAt && (
          <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            已于 {formatDate(enrollment.completedAt)} 完成学习
          </p>
        )}
      </div>
    </div>
  );
}

export default function LearningCenter() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, enrollments, loadCourses, loadEnrollments, setEnrollments } = useDataStore();
  const [activeTab, setActiveTab] = useState<TabType>('enrolled');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [learningId, setLearningId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    if (user?.id) {
      loadEnrollments(user.id);
    }
  }, [user?.id, loadCourses, loadEnrollments]);

  const userEnrollments = useMemo(
    () => enrollments.filter((e) => e.userId === user?.id),
    [enrollments, user?.id]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(userEnrollments.map((e) => e.courseId)),
    [userEnrollments]
  );

  const availableCourses = useMemo(
    () => courses.filter((c) => !enrolledCourseIds.has(c.id)),
    [courses, enrolledCourseIds]
  );

  const enrolledCourses = useMemo(() => {
    return userEnrollments
      .map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
        return course ? { course, enrollment } : null;
      })
      .filter(Boolean) as { course: Course; enrollment: Enrollment }[];
  }, [userEnrollments, courses]);

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;
    setEnrollingId(courseId);
    try {
      const response = await enrollmentApi.enrollCourse(user.id, courseId);
      if (response.success && response.data) {
        setEnrollments([...enrollments, response.data]);
        setActiveTab('enrolled');
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const handleLearn = async (enrollmentId: string) => {
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment || enrollment.progress >= 100) return;

    setLearningId(enrollmentId);
    try {
      const newProgress = Math.min(100, enrollment.progress + 25);
      const response = await enrollmentApi.updateProgress(enrollmentId, newProgress);
      if (response.success && response.data) {
        setEnrollments(
          enrollments.map((e) => (e.id === enrollmentId ? response.data! : e))
        );
      }
    } finally {
      setLearningId(null);
    }
  };

  const handleTakeExam = (courseId: string) => {
    navigate('/emp/exams', { state: { startExamFor: courseId } });
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'enrolled', label: '已报名课程', count: enrolledCourses.length },
    { key: 'available', label: '可报名课程', count: availableCourses.length },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">学习中心</h2>
          <p className="text-gray-500 mt-1">浏览和学习企业培训课程</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 sm:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs',
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'available' ? (
            availableCourses.length === 0 ? (
              <div className="py-16">
                <Empty />
                <p className="text-center text-gray-500 mt-4">
                  暂无可报名的课程，所有课程您都已报名
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {availableCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    type="available"
                    onEnroll={handleEnroll}
                    enrolling={enrollingId === course.id}
                  />
                ))}
              </div>
            )
          ) : enrolledCourses.length === 0 ? (
            <div className="py-16">
              <Empty />
              <p className="text-center text-gray-500 mt-4">
                您还没有报名任何课程，去「可报名课程」看看吧
              </p>
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setActiveTab('available')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  浏览课程
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {enrolledCourses.map(({ course, enrollment }) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrollment={enrollment}
                  type="enrolled"
                  onLearn={handleLearn}
                  onTakeExam={handleTakeExam}
                  learning={learningId === enrollment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

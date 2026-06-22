import { useEffect, useMemo, useState } from 'react';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Award,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  BookOpen,
} from 'lucide-react';
import Empty from '@/components/Empty';
import AppLayout from '@/components/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import { examApi } from '@/api';
import type {
  Course,
  ExamAttempt,
  ExamAnswer,
  Question,
  Position,
  Certificate,
} from '../../../shared/types';

type TabType = 'available' | 'history';

interface ExamState {
  course: Course;
  exam: ExamAttempt;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number[]>;
  submitted: boolean;
  score?: number;
  passed?: boolean;
  certificate?: Certificate;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'single':
      return '单选题';
    case 'multiple':
      return '多选题';
    case 'judge':
      return '判断题';
    default:
      return type;
  }
}

function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'single':
      return 'bg-blue-100 text-blue-700';
    case 'multiple':
      return 'bg-purple-100 text-purple-700';
    case 'judge':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

interface ExamCardProps {
  course: Course;
  attemptCount: number;
  maxRetakes: number;
  canTake: boolean;
  onStart: () => void;
  starting?: boolean;
}

function ExamCard({ course, attemptCount, maxRetakes, canTake, onStart, starting }: ExamCardProps) {
  const retakesRemaining = Math.max(0, maxRetakes + 1 - attemptCount);
  const isDisabled = !canTake || starting;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-900 truncate">{course.name}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ml-4 flex-shrink-0">
          <FileCheck className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <FileCheck className="h-3.5 w-3.5" />
          {course.questionCount} 题
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" />
          及格 {course.passingScore} 分
        </span>
        <span className="flex items-center gap-1">
          <RotateCcw className="h-3.5 w-3.5" />
          剩余 {retakesRemaining} 次
        </span>
      </div>

      {!canTake && attemptCount > maxRetakes && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
          <p className="text-xs text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            补考次数已超限，请联系管理员
          </p>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isDisabled}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98'
        )}
      >
        {starting ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            准备中...
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4" />
            开始考试
          </>
        )}
      </button>
    </div>
  );
}

interface HistoryCardProps {
  exam: ExamAttempt;
  courseName: string;
}

function HistoryCard({ exam, courseName }: HistoryCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-900 truncate">{courseName}</h4>
          <p className="text-sm text-gray-500 mt-1">
            第 {exam.attemptNumber} 次考试 · {formatDateTime(exam.startedAt)}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ml-3',
            exam.passed
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          )}
        >
          {exam.passed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {exam.passed ? '通过' : '未通过'}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-500">得分</p>
          <p className={cn(
            'text-2xl font-bold',
            exam.passed ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {exam.score}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">题目</p>
          <p className="text-2xl font-bold text-gray-900">{exam.questionIds.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">正确</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((exam.score / 100) * exam.questionIds.length)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ExamView({
  examState,
  onBack,
  onSubmitSuccess,
}: {
  examState: ExamState;
  onBack: () => void;
  onSubmitSuccess: (result: { score: number; passed: boolean; certificate?: Certificate }) => void;
}) {
  const { course, exam, questions, currentIndex, answers, submitted, score, passed, certificate } = examState;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number[]>>(answers);
  const [currentIdx, setCurrentIdx] = useState(currentIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ score: number; passed: boolean; certificate?: Certificate } | null>(
    submitted ? { score: score!, passed: passed!, certificate } : null
  );

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k] && selectedAnswers[k].length > 0
  ).length;

  const handleOptionClick = (questionId: string, optionIndex: number, type: string) => {
    if (submitResult) return;

    setSelectedAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'multiple') {
        if (current.includes(optionIndex)) {
          return { ...prev, [questionId]: current.filter((i) => i !== optionIndex) };
        } else {
          return { ...prev, [questionId]: [...current, optionIndex] };
        }
      } else {
        return { ...prev, [questionId]: [optionIndex] };
      }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const answerList: ExamAnswer[] = questions.map((q) => ({
        questionId: q.id,
        selectedAnswers: selectedAnswers[q.id] || [],
      }));

      const response = await examApi.submitExam(exam.id, answerList);
      if (response.success && response.data) {
        const result = {
          score: response.data.score,
          passed: response.data.passed,
        };
        setSubmitResult(result);
        onSubmitSuccess(result);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className={cn(
              'p-8 text-center',
              submitResult.passed
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            )}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 mx-auto mb-4">
              {submitResult.passed ? (
                <Trophy className="h-10 w-10 text-white" />
              ) : (
                <XCircle className="h-10 w-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {submitResult.passed ? '恭喜您，考试通过！' : '很遗憾，考试未通过'}
            </h2>
            <p className="text-white/80">{course.name}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">考试得分</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    submitResult.passed ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {submitResult.score}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">及格分数</p>
                <p className="text-3xl font-bold text-gray-900">{course.passingScore}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">总题数</p>
                <p className="text-3xl font-bold text-gray-900">{totalQuestions}</p>
              </div>
            </div>

            {submitResult.passed && (
              <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">证书已颁发</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      您已通过考试，系统已自动为您生成证书
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        有效期 {course.certificateValidDays} 天
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!submitResult.passed && (
              <div className="mb-8 p-5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">下次加油</h4>
                    <p className="text-sm text-gray-600">
                      您可以参加补考，请在补考次数限制内完成考试
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                返回考试列表
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                answeredCount === totalQuestions
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
              )}
            >
              已答 {answeredCount}/{totalQuestions}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">{course.name}</h2>
          <p className="text-sm text-gray-500">
            共 {totalQuestions} 道题，及格分数 {course.passingScore} 分
          </p>

          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              第 {currentIdx + 1} 题 / 共 {totalQuestions} 题
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                  getQuestionTypeColor(currentQuestion.type)
                )}
              >
                {getQuestionTypeLabel(currentQuestion.type)}
              </span>
              {currentQuestion.type === 'multiple' && (
                <span className="text-xs text-gray-500">（多选）</span>
              )}
            </div>
            <p className="text-lg font-medium text-gray-900">{currentQuestion.content}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(currentQuestion.id, idx, currentQuestion.type)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold flex-shrink-0 transition-colors',
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={cn('text-sm', isSelected ? 'text-gray-900 font-medium' : 'text-gray-700')}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">点击选项选择答案，多选题可选择多个</p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
            {questions.map((q, idx) => {
              const answered = (selectedAnswers[q.id] || []).length > 0;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={cn(
                    'h-10 rounded-lg text-sm font-medium transition-all duration-200',
                    isCurrent
                      ? answered
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2'
                        : 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2'
                      : answered
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                currentIdx === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              上一题
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIdx(Math.min(totalQuestions - 1, currentIdx + 1))}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                下一题
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isSubmitting || answeredCount < totalQuestions
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    提交试卷
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamCenter() {
  const { user } = useAuthStore();
  const {
    courses,
    enrollments,
    exams,
    questions,
    positions,
    certificates,
    loadCourses,
    loadEnrollments,
    loadExams,
    loadQuestions,
    loadPositions,
    loadCertificates,
    setExams,
    setQuestions,
    setCertificates,
  } = useDataStore();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [examState, setExamState] = useState<ExamState | null>(null);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    loadPositions();
    if (user?.id) {
      loadEnrollments(user.id);
      loadExams(user.id);
      loadCertificates(user.id);
    }
    loadQuestions();
  }, [user?.id, loadCourses, loadEnrollments, loadExams, loadQuestions, loadPositions, loadCertificates]);

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

  const userPosition: Position | null = useMemo(() => {
    if (!user?.positionId) return null;
    return positions.find((p) => p.id === user.positionId) || null;
  }, [user?.positionId, positions]);

  const availableExams = useMemo(() => {
    const passedCourseIds = new Set(
      userExams.filter((e) => e.passed && e.submitted).map((e) => e.courseId)
    );
    const validCertCourseIds = new Set(
      userCertificates.filter((c) => c.status === 'valid').map((c) => c.courseId)
    );

    return userEnrollments
      .filter((e) => e.progress === 100)
      .map((e) => {
        const course = courses.find((c) => c.id === e.courseId);
        if (!course) return null;
        if (passedCourseIds.has(course.id) || validCertCourseIds.has(course.id)) return null;

        const attemptCount = userExams.filter((ex) => ex.courseId === course.id && ex.submitted).length;
        const maxRetakes = userPosition?.maxRetakeCount ?? 2;

        return {
          course,
          attemptCount,
          maxRetakes,
          canTake: attemptCount <= maxRetakes,
        };
      })
      .filter(Boolean) as { course: Course; attemptCount: number; maxRetakes: number; canTake: boolean }[];
  }, [userEnrollments, courses, userExams, userCertificates, userPosition]);

  const examHistory = useMemo(() => {
    return [...userExams]
      .filter((e) => e.submitted)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [userExams]);

  const handleStartExam = async (courseId: string) => {
    setStartingExamId(courseId);
    try {
      const response = await examApi.startExam(courseId);
      if (response.success && response.data) {
        const exam = response.data;
        const courseQuestions = questions.filter((q) => exam.questionIds.includes(q.id));
        setExamState({
          course: courses.find((c) => c.id === courseId)!,
          exam,
          questions: courseQuestions,
          currentIndex: 0,
          answers: {},
          submitted: false,
        });
        setExams([...exams, exam]);
      }
    } finally {
      setStartingExamId(null);
    }
  };

  const handleSubmitSuccess = (result: { score: number; passed: boolean }) => {
    if (examState) {
      setExamState({
        ...examState,
        submitted: true,
        score: result.score,
        passed: result.passed,
      });
      if (result.passed) {
        loadCertificates(user?.id);
      }
    }
  };

  const handleBackToList = () => {
    setExamState(null);
    if (user?.id) {
      loadExams(user.id);
      loadCertificates(user.id);
    }
  };

  const getCourseName = (courseId: string): string => {
    return courses.find((c) => c.id === courseId)?.name || courseId;
  };

  if (examState) {
    return (
      <ExamView
        examState={examState}
        onBack={handleBackToList}
        onSubmitSuccess={handleSubmitSuccess}
      />
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'available', label: '可参加考试', count: availableExams.length },
    { key: 'history', label: '考试历史', count: examHistory.length },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">考试中心</h2>
          <p className="text-gray-500 mt-1">参加课程考试，获取岗位证书</p>
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
            availableExams.length === 0 ? (
              <div className="py-16">
                <Empty />
                <p className="text-center text-gray-500 mt-4">
                  暂无可参加的考试，请先完成课程学习
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableExams.map(({ course, attemptCount, maxRetakes, canTake }) => (
                  <ExamCard
                    key={course.id}
                    course={course}
                    attemptCount={attemptCount}
                    maxRetakes={maxRetakes}
                    canTake={canTake}
                    onStart={() => handleStartExam(course.id)}
                    starting={startingExamId === course.id}
                  />
                ))}
              </div>
            )
          ) : examHistory.length === 0 ? (
            <div className="py-16">
              <Empty />
              <p className="text-center text-gray-500 mt-4">
                暂无考试记录
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {examHistory.map((exam) => (
                <HistoryCard
                  key={exam.id}
                  exam={exam}
                  courseName={getCourseName(exam.courseId)}
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

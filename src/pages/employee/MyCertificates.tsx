import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import Empty from '@/components/Empty';
import AppLayout from '@/components/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import type { Certificate, CertificateStatus } from '../../../shared/types';

type TabType = 'all' | CertificateStatus;

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

function getStatusConfig(status: CertificateStatus, expiresAt: string) {
  const days = getDaysUntilExpiry(expiresAt);
  switch (status) {
    case 'valid':
      if (days <= 30) {
        return {
          label: `${days}天后到期`,
          icon: Clock,
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
          cardClass: 'border-amber-200 bg-amber-50/30',
          gradientFrom: 'from-amber-500',
          gradientTo: 'to-orange-500',
        };
      }
      return {
        label: '有效',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        cardClass: 'border-emerald-200 bg-emerald-50/30',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-teal-500',
      };
    case 'expiring':
      return {
        label: days > 0 ? `${days}天后到期` : '即将到期',
        icon: AlertTriangle,
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        cardClass: 'border-amber-200 bg-amber-50/30',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-orange-500',
      };
    case 'expired':
      return {
        label: '已过期',
        icon: XCircle,
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
        cardClass: 'border-rose-200 bg-rose-50/30',
        gradientFrom: 'from-rose-500',
        gradientTo: 'to-red-500',
      };
  }
}

interface CertificateCardProps {
  certificate: Certificate;
  courseName: string;
  onRenew?: (certificateId: string) => void;
  renewing?: boolean;
}

function CertificateCard({ certificate, courseName, onRenew, renewing }: CertificateCardProps) {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(certificate.status, certificate.expiresAt);
  const StatusIcon = statusConfig.icon;
  const canRenew = certificate.status === 'expiring' || certificate.status === 'expired';
  const days = getDaysUntilExpiry(certificate.expiresAt);

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 group',
        statusConfig.cardClass
      )}
    >
      <div
        className={cn(
          'h-32 bg-gradient-to-br relative overflow-hidden',
          statusConfig.gradientFrom,
          statusConfig.gradientTo
        )}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-4 right-4">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border',
              statusConfig.badgeClass
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig.label}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/70">培训证书</p>
            <p className="text-sm font-semibold text-white">
              {certificate.status === 'valid' && days > 30 ? 'CERT-VALID' : certificate.status === 'expiring' || (certificate.status === 'valid' && days <= 30) ? 'CERT-EXPIRING' : 'CERT-EXPIRED'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {courseName}
        </h4>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>颁发日期：{formatDate(certificate.issuedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>到期日期：{formatDate(certificate.expiresAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileCheck className="h-4 w-4" />
            <span>版本号：v{certificate.version}</span>
          </div>
        </div>

        {canRenew ? (
          <button
            onClick={() => onRenew?.(certificate.id)}
            disabled={renewing}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              renewing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : certificate.status === 'expired'
                ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-98'
                : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-98'
            )}
          >
            {renewing ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                续期考试
              </>
            )}
          </button>
        ) : (
          <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            证书有效
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyCertificates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    courses,
    certificates,
    loadCourses,
    loadCertificates,
    setCertificates,
  } = useDataStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    if (user?.id) {
      loadCertificates(user.id);
    }
  }, [user?.id, loadCourses, loadCertificates]);

  const userCertificates = useMemo(
    () =>
      [...certificates]
        .filter((c) => c.userId === user?.id)
        .sort((a, b) => {
          const statusOrder = { expiring: 0, expired: 1, valid: 2 };
          const orderA = statusOrder[a.status] ?? 3;
          const orderB = statusOrder[b.status] ?? 3;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }),
    [certificates, user?.id]
  );

  const validCerts = useMemo(
    () => userCertificates.filter((c) => c.status === 'valid' && getDaysUntilExpiry(c.expiresAt) > 30),
    [userCertificates]
  );

  const expiringCerts = useMemo(
    () =>
      userCertificates.filter(
        (c) => c.status === 'expiring' || (c.status === 'valid' && getDaysUntilExpiry(c.expiresAt) <= 30)
      ),
    [userCertificates]
  );

  const expiredCerts = useMemo(
    () => userCertificates.filter((c) => c.status === 'expired'),
    [userCertificates]
  );

  const displayedCertificates = useMemo(() => {
    switch (activeTab) {
      case 'valid':
        return validCerts;
      case 'expiring':
        return expiringCerts;
      case 'expired':
        return expiredCerts;
      default:
        return userCertificates;
    }
  }, [activeTab, validCerts, expiringCerts, expiredCerts, userCertificates]);

  const stats = {
    all: userCertificates.length,
    valid: validCerts.length,
    expiring: expiringCerts.length,
    expired: expiredCerts.length,
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'valid', label: '有效' },
    { key: 'expiring', label: '即将到期' },
    { key: 'expired', label: '已过期' },
  ];

  const handleRenew = (certificateId: string) => {
    navigate('/emp/exams');
  };

  const getCourseName = (courseId: string): string => {
    return courses.find((c) => c.id === courseId)?.name || courseId;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">我的证书</h2>
          <p className="text-gray-500 mt-1">查看和管理您的培训证书</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
              <p className="text-xs text-gray-500">全部证书</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.valid}</p>
              <p className="text-xs text-gray-500">有效证书</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              <p className="text-xs text-gray-500">即将到期</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              <p className="text-xs text-gray-500">已过期</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
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
                  {stats[tab.key]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {displayedCertificates.length === 0 ? (
            <div className="py-16">
              <Empty />
              <p className="text-center text-gray-500 mt-4">
                {activeTab === 'all'
                  ? '您还没有任何证书，快去参加考试获取证书吧'
                  : activeTab === 'valid'
                  ? '暂无有效证书'
                  : activeTab === 'expiring'
                  ? '暂无即将到期的证书'
                  : '暂无已过期的证书'}
              </p>
              {activeTab === 'all' && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => navigate('/emp/exams')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FileCheck className="h-4 w-4" />
                    参加考试
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedCertificates.map((cert: Certificate) => (
                <CertificateCard
                  key={cert.id}
                  certificate={cert}
                  courseName={getCourseName(cert.courseId)}
                  onRenew={handleRenew}
                  renewing={renewingId === cert.id}
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

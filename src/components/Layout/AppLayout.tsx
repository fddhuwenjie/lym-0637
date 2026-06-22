import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

type Role = 'hr' | 'employee';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppLayoutProps = {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  userName?: string;
};

const pathToBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/hr/dashboard': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '仪表盘' }],
  '/hr/courses': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '课程管理' }],
  '/hr/questions': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '题库管理' }],
  '/hr/positions': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '岗位管理' }],
  '/hr/certificates': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '证书配置' }],
  '/hr/compliance': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '员工达标看板' }],
  '/hr/exams': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '考试明细' }],
  '/hr/export': [{ label: '首页', href: '/' }, { label: 'HR 管理', href: '/hr/dashboard' }, { label: '数据导出' }],
  '/employee/dashboard': [{ label: '首页', href: '/' }, { label: '员工中心', href: '/employee/dashboard' }, { label: '个人看板' }],
  '/employee/learning': [{ label: '首页', href: '/' }, { label: '员工中心', href: '/employee/dashboard' }, { label: '学习中心' }],
  '/employee/exams': [{ label: '首页', href: '/' }, { label: '员工中心', href: '/employee/dashboard' }, { label: '考试中心' }],
  '/employee/certificates': [{ label: '首页', href: '/' }, { label: '员工中心', href: '/employee/dashboard' }, { label: '我的证书' }],
};

export default function AppLayout({
  children,
  breadcrumbs: customBreadcrumbs,
  className,
  userName = '管理员',
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<Role>('hr');

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    const defaultPath = newRole === 'hr' ? '/hr/dashboard' : '/employee/dashboard';
    navigate(defaultPath);
  };

  const handleLogout = () => {
    console.log('退出登录');
  };

  const breadcrumbs = customBreadcrumbs || pathToBreadcrumbs[location.pathname] || [{ label: '首页', href: '/' }];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activePath={location.pathname}
        onNavigate={handleNavigate}
        currentRole={role}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        userName={userName}
      />
      <div className="lg:pl-64">
        <Header
          breadcrumbs={breadcrumbs}
          userName={userName}
          onBreadcrumbClick={handleNavigate}
        />
        <main className={cn('p-4 lg:p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

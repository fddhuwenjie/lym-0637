import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Briefcase,
  Award,
  ClipboardCheck,
  FileText,
  Download,
  Menu,
  X,
  LogOut,
  GraduationCap,
  User,
  Medal,
} from 'lucide-react';

const hrNavItems = [
  { path: '/hr/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/hr/courses', label: '课程管理', icon: BookOpen },
  { path: '/hr/questions', label: '题库管理', icon: HelpCircle },
  { path: '/hr/positions', label: '岗位管理', icon: Briefcase },
  { path: '/hr/cert-config', label: '证书配置', icon: Award },
  { path: '/hr/compliance', label: '员工达标看板', icon: ClipboardCheck },
  { path: '/hr/exam-records', label: '考试明细', icon: FileText },
  { path: '/hr/export', label: '数据导出', icon: Download },
];

const empNavItems = [
  { path: '/emp/dashboard', label: '个人看板', icon: User },
  { path: '/emp/learning', label: '学习中心', icon: GraduationCap },
  { path: '/emp/exams', label: '考试中心', icon: ClipboardCheck },
  { path: '/emp/certificates', label: '我的证书', icon: Medal },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = role === 'hr' ? hrNavItems : empNavItems;
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={cn(
          'flex flex-col bg-primary text-white transition-all duration-300 flex-shrink-0',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary-light">
          {sidebarOpen && (
            <span className="text-lg font-semibold whitespace-nowrap">
              {role === 'hr' ? 'HR 培训管理' : '员工学习中心'}
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary-light p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-lg flex-shrink-0">
              {user?.avatar || '👤'}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.name || '用户'}</p>
                <p className="text-xs text-white/60 truncate">
                  {role === 'hr' ? 'HR 管理员' : '员工'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm whitespace-nowrap">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{role === 'hr' ? '人事管理' : '员工中心'}</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">
              {currentLabel || '仪表盘'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name || '用户'}</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
              {user?.avatar || '�'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

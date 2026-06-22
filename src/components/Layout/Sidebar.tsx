import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Briefcase,
  Award,
  Users,
  FileText,
  Download,
  User,
  GraduationCap,
  ClipboardCheck,
  Medal,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

type Role = 'hr' | 'employee';

const hrMenu: MenuItem[] = [
  { label: '仪表盘', icon: <LayoutDashboard size={20} />, href: '/hr/dashboard' },
  { label: '课程管理', icon: <BookOpen size={20} />, href: '/hr/courses' },
  { label: '题库管理', icon: <HelpCircle size={20} />, href: '/hr/questions' },
  { label: '岗位管理', icon: <Briefcase size={20} />, href: '/hr/positions' },
  { label: '证书配置', icon: <Award size={20} />, href: '/hr/certificates' },
  { label: '员工达标看板', icon: <Users size={20} />, href: '/hr/compliance' },
  { label: '考试明细', icon: <FileText size={20} />, href: '/hr/exams' },
  { label: '数据导出', icon: <Download size={20} />, href: '/hr/export' },
];

const employeeMenu: MenuItem[] = [
  { label: '个人看板', icon: <User size={20} />, href: '/employee/dashboard' },
  { label: '学习中心', icon: <GraduationCap size={20} />, href: '/employee/learning' },
  { label: '考试中心', icon: <ClipboardCheck size={20} />, href: '/employee/exams' },
  { label: '我的证书', icon: <Medal size={20} />, href: '/employee/certificates' },
];

type SidebarProps = {
  activePath?: string;
  onNavigate?: (href: string) => void;
  currentRole?: Role;
  onRoleChange?: (role: Role) => void;
  onLogout?: () => void;
  userName?: string;
};

export default function Sidebar({
  activePath = '/hr/dashboard',
  onNavigate,
  currentRole: initialRole = 'hr',
  onRoleChange,
  onLogout,
  userName = '管理员',
}: SidebarProps) {
  const [currentRole, setCurrentRole] = useState<Role>(initialRole);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = currentRole === 'hr' ? hrMenu : employeeMenu;

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    setIsRoleDropdownOpen(false);
    onRoleChange?.(role);
  };

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    setIsMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-primary text-white"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-primary text-white flex flex-col transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-primary-light px-4">
          <span className="text-xl font-bold tracking-wide">培训管理系统</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-300 tracking-wider">
            {currentRole === 'hr' ? 'HR 管理' : '员工中心'}
          </div>
          {menuItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-light text-white'
                    : 'text-gray-300 hover:bg-primary-light hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-primary-light p-3 space-y-2">
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-primary-light hover:bg-primary-light/80 transition-colors text-sm"
            >
              <span className="flex items-center gap-2">
                <User size={18} />
                <span>切换角色</span>
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  'transition-transform',
                  isRoleDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-primary-light rounded-md shadow-lg overflow-hidden">
                <button
                  onClick={() => handleRoleChange('hr')}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left hover:bg-primary/50 transition-colors',
                    currentRole === 'hr' && 'bg-primary/50'
                  )}
                >
                  HR 管理员
                </button>
                <button
                  onClick={() => handleRoleChange('employee')}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left hover:bg-primary/50 transition-colors',
                    currentRole === 'employee' && 'bg-primary/50'
                  )}
                >
                  员工
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-300">
                {currentRole === 'hr' ? 'HR 管理员' : '员工'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-danger/20 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>
    </>
  );
}

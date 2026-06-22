import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '../../shared/types';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  users: User[];
  isSelected: boolean;
  onSelect: () => void;
  onLogin: (name: string) => void;
  loading: boolean;
}

function RoleCard({
  role,
  title,
  description,
  icon: Icon,
  users,
  isSelected,
  onSelect,
  onLogin,
  loading,
}: RoleCardProps) {
  const isHr = role === 'hr';

  return (
    <div
      className={cn(
        'relative group rounded-2xl p-8 cursor-pointer transition-all duration-500 transform hover:-translate-y-2',
        isSelected
          ? isHr
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/30 scale-105'
            : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl shadow-emerald-500/30 scale-105'
          : 'bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20'
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          isHr
            ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20'
            : 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20'
        )}
      />

      <div className="relative z-10">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl mb-6 transition-transform duration-500 group-hover:scale-110',
            isSelected
              ? 'bg-white/20'
              : isHr
              ? 'bg-blue-500/20'
              : 'bg-emerald-500/20'
          )}
        >
          <Icon
            className={cn(
              'h-8 w-8 transition-colors duration-300',
              isSelected ? 'text-white' : isHr ? 'text-blue-400' : 'text-emerald-400'
            )}
          />
        </div>

        <h3
          className={cn(
            'text-2xl font-bold mb-2 transition-colors duration-300',
            isSelected ? 'text-white' : 'text-white'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-sm mb-6 transition-colors duration-300',
            isSelected ? 'text-white/80' : 'text-white/60'
          )}
        >
          {description}
        </p>

        {isSelected && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-white/70 mb-3">选择用户快速登录</p>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogin(user.name);
                }}
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group/user',
                  isHr
                    ? 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">
                    {user.avatar}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-white/60">{isHr ? '人事管理员' : '员工'}</p>
                  </div>
                </div>
                {loading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-white/60 group-hover/user:text-white group-hover/user:translate-x-1 transition-all duration-300" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user, role } = useAuthStore();
  const { users, loadUsers } = useDataStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (user && role) {
      navigate(role === 'hr' ? '/hr/dashboard' : '/emp/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  const hrUsers = users.filter((u) => u.role === 'hr');
  const empUsers = users.filter((u) => u.role === 'employee');

  const handleLogin = async (name: string) => {
    clearError();
    const success = await login(name);
    if (success) {
      const userRole = users.find((u) => u.name === name)?.role;
      if (userRole === 'hr') {
        navigate('/hr/dashboard', { replace: true });
      } else if (userRole === 'employee') {
        navigate('/emp/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40 mb-6">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            企业培训管理系统
          </h1>
          <p className="text-lg text-white/60 max-w-md mx-auto">
            专业的在线学习、考试与证书管理平台
          </p>
        </div>

        {error && (
          <div className="mb-8 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
          <RoleCard
            role="hr"
            title="人事管理员"
            description="管理课程、题库、岗位配置及合规审查"
            icon={Users}
            users={hrUsers}
            isSelected={selectedRole === 'hr'}
            onSelect={() => setSelectedRole('hr')}
            onLogin={handleLogin}
            loading={isLoading}
          />

          <RoleCard
            role="employee"
            title="员工"
            description="在线学习、参加考试、管理个人证书"
            icon={Briefcase}
            users={empUsers}
            isSelected={selectedRole === 'employee'}
            onSelect={() => setSelectedRole('employee')}
            onLogin={handleLogin}
            loading={isLoading}
          />
        </div>

        <p className="mt-12 text-sm text-white/40">
          © 2026 企业培训管理系统 · 安全 · 高效 · 专业
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

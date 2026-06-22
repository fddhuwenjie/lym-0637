import { ChevronRight, Bell, User } from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type HeaderProps = {
  breadcrumbs?: BreadcrumbItem[];
  userName?: string;
  userAvatar?: string;
  onBreadcrumbClick?: (href: string) => void;
};

export default function Header({
  breadcrumbs = [{ label: '首页', href: '/' }],
  userName = '管理员',
  userAvatar,
  onBreadcrumbClick,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <nav className="flex items-center text-sm">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight size={16} className="mx-2 text-gray-400" />}
            {item.href && index !== breadcrumbs.length - 1 ? (
              <button
                onClick={() => onBreadcrumbClick?.(item.href!)}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

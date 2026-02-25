import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  UploadCloud,
  Brain,
  Settings,
  FileStack,
  Landmark,
  LayoutList,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const NavItem = ({ icon: Icon, label, active, onClick, collapsed }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full px-3 py-2 text-sm font-medium transition-colors rounded-lg group",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <Icon className={cn("w-5 h-5", collapsed ? "mx-auto" : "mr-3")} />
    {!collapsed && <span>{label}</span>}
  </button>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Helper to determine active state
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const getPageTitle = () => {
    switch (true) {
      case pathname === '/': return 'Dashboard';
      case pathname.startsWith('/transactions'): return 'Transactions';
      case pathname.startsWith('/import'): return 'Import';
      case pathname.startsWith('/mappings'): return 'Categorization Rules';
      case pathname.startsWith('/backups'): return 'Backups';
      case pathname.startsWith('/accounts'): return 'Accounts';
      case pathname.startsWith('/budgets'): return 'Budget Manager';
      case pathname.startsWith('/buckets'): return 'Buckets';
      case pathname.startsWith('/categories'): return 'Categories';
      case pathname.startsWith('/fixed'): return 'Fixed Expenses';
      case pathname.startsWith('/bills'): return 'Bills & Subscriptions';
      case pathname.startsWith('/settings'): return 'Settings';
      default: return 'BankPro';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center h-16 px-4 mb-4 border-b">
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-primary">
              🏦 BankPro
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 ml-auto rounded-md hover:bg-accent text-muted-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={isActive('/')}
            onClick={() => navigate('/')}
            collapsed={collapsed}
          />
          <NavItem
            icon={Receipt}
            label="Transactions"
            active={isActive('/transactions')}
            onClick={() => navigate('/transactions')}
            collapsed={collapsed}
          />
          <NavItem
            icon={Landmark}
            label="Accounts"
            active={isActive('/accounts')}
            onClick={() => navigate('/accounts')}
            collapsed={collapsed}
          />
          <NavItem
            icon={TrendingDown}
            label="Budget Manager"
            active={isActive('/budgets')}
            onClick={() => navigate('/budgets')}
            collapsed={collapsed}
          />
          <NavItem
            icon={FileStack}
            label="Buckets"
            active={isActive('/buckets')}
            onClick={() => navigate('/buckets')}
            collapsed={collapsed}
          />
          <NavItem
            icon={Tag}
            label="Categories"
            active={isActive('/categories')}
            onClick={() => navigate('/categories')}
            collapsed={collapsed}
          />
          <NavItem
            icon={LayoutList}
            label="Fixed Expenses"
            active={isActive('/fixed')}
            onClick={() => navigate('/fixed')}
            collapsed={collapsed}
          />
          <NavItem
            icon={CheckSquare}
            label="Bills & Subscriptions"
            active={isActive('/bills')}
            onClick={() => navigate('/bills')}
            collapsed={collapsed}
          />
          <NavItem
            icon={Brain}
            label="Categorization Rules"
            active={isActive('/mappings')}
            onClick={() => navigate('/mappings')}
            collapsed={collapsed}
          />
          <NavItem
            icon={UploadCloud}
            label="Import"
            active={isActive('/import')}
            onClick={() => navigate('/import')}
            collapsed={collapsed}
          />
          <NavItem
            icon={FileStack}
            label="Backups"
            active={isActive('/backups')}
            onClick={() => navigate('/backups')}
            collapsed={collapsed}
          />
        </nav>

        <div className="p-3 border-t">
          <NavItem
            icon={Settings}
            label="Settings"
            active={isActive('/settings')}
            onClick={() => navigate('/settings')}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header (Placeholder if needed) */}
        <div className="md:hidden flex items-center h-14 px-4 border-b bg-card">
          <span className="font-semibold">{getPageTitle()}</span>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-background/50">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

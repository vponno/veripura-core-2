import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Settings, UserCircle, Menu, X, LogOut, Briefcase, ShieldAlert, Database, Laptop, Sun, Moon } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, setUserRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = currentUser?.email === 'onno@veripura.com';

  const navItems = [
    { name: 'Dashboard', path: '/register-consignment', icon: <LayoutDashboard size={20} /> },
    { name: 'Consignments', path: '/consignments', icon: <FileText size={20} /> },
    { name: 'Export Assessment', path: '/compliance/assessment', icon: <ShieldAlert size={20} /> },
    { name: 'Review Hub', path: '/admin-review', icon: <ShieldAlert size={20} />, adminOnly: true },
    { name: 'Data Export', path: '/admin/export', icon: <Database size={20} />, adminOnly: true },
    { name: 'History', path: '/supply-chain', icon: <History size={20} /> },
    { name: 'My Wallet', path: '/wallet', icon: <UserCircle size={20} /> },
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans text-textMain transition-colors duration-200">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-slate-100 dark:border-slate-800 p-6 sticky top-0 h-screen shadow-sm z-10 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">VeriPura</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Export Assessment</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                  ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">

          {/* Theme Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-1.5 rounded-md flex justify-center transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Light Mode"
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-1.5 rounded-md flex justify-center transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Dark Mode"
            >
              <Moon size={16} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 p-1.5 rounded-md flex justify-center transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="System Auto"
            >
              <Laptop size={16} />
            </button>
          </div>

          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-textMuted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-medium text-sm"
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>

          <div className="flex items-center gap-3 px-4 py-3 mt-4">
            <UserCircle className="text-slate-400" size={32} />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate dark:text-slate-200">{currentUser?.email?.split('@')[0] || 'User'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-surface transition-colors duration-200">
        {children}
        <footer className="mt-12 text-center text-xs text-slate-400">
          &copy; 2026 VeriPura&trade; | <span className="text-primary">www.veripura.com</span>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
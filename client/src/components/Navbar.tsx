import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { Sun, Moon, Link as LinkIcon, BarChart3, Settings, LogOut, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-nordic-border dark:border-nordic-dark-border bg-nordic-surface/80 dark:bg-nordic-dark-surface/80 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-nordic-pine flex items-center justify-center text-white shadow-sm group-hover:scale-[1.02] transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H9M17 7V15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-nordic-pine dark:text-nordic-mist">
            NordLink
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-nordic-mist/60 dark:bg-nordic-dark-border text-nordic-pine dark:text-nordic-sage font-semibold'
                    : 'text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Links</span>
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/analytics')
                    ? 'bg-nordic-mist/60 dark:bg-nordic-dark-border text-nordic-pine dark:text-nordic-sage font-semibold'
                    : 'text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-nordic-mist/60 dark:bg-nordic-dark-border text-nordic-pine dark:text-nordic-sage font-semibold'
                    : 'text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </>
          ) : (
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-nordic-pine dark:text-nordic-sage font-semibold'
                  : 'text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text'
              }`}
            >
              Overview
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text hover:bg-nordic-border/50 dark:hover:bg-nordic-dark-border transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-nordic-charcoal dark:text-nordic-dark-text">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full border border-nordic-border dark:border-nordic-dark-border object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-nordic-sage text-nordic-pine font-medium flex items-center justify-center text-xs">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium truncate max-w-[120px]">{user.name || user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl text-nordic-slate hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-nordic-pine text-white hover:bg-nordic-pine-light transition-all shadow-sm active:scale-95"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

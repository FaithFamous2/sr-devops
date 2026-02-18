import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon components
function LockIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ClipboardListIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function SunIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Create Secret', icon: LockIcon },
    { path: '/activity', label: 'Activity', icon: ClipboardListIcon },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Secure Drop</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Self-destructing secrets</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-item ${location.pathname === item.path ? 'sidebar-item-active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="sidebar-item w-full justify-start"
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon className="w-5 h-5" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="w-5 h-5" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Keyboard Shortcuts Help */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium mb-2">Keyboard Shortcuts</p>
              <p><kbd>⌘</kbd> + <kbd>N</kbd> New secret</p>
              <p><kbd>⌘</kbd> + <kbd>D</kbd> Toggle dark mode</p>
              <p><kbd>Esc</kbd> Close dialogs</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

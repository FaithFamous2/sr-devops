import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastProvider } from './Toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/hooks/useTheme';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toggleTheme } = useTheme();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', ctrl: true, action: toggleTheme, description: 'Toggle dark mode' },
    { key: 'n', ctrl: true, action: () => window.location.href = '/', description: 'New secret' },
  ]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-20 glass border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo for mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white">🔒</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Secure Drop</span>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost text-sm"
                >
                  API Docs
                </a>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 md:p-6 lg:p-8 flex-1">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Secure Drop - Self-destructing secrets • Built with Laravel & React</p>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}

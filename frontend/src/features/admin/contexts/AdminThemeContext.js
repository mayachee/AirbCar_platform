'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminThemeContext = createContext(undefined);

export function AdminThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage or system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-theme');
      if (stored === 'dark') {
        setIsDark(true);
      } else if (stored === 'light') {
        setIsDark(false);
      } else {
        // Fall back to system preference
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        setIsDark(!!prefersDark);
      }
    } catch {
      // SSR or localStorage unavailable
    }
  }, []);

  // Sync to <html> class and localStorage
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('admin-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('admin-theme', 'light');
      }
    } catch {}
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  return (
    <AdminThemeContext.Provider value={{ isDark, toggleTheme, setIsDark }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (ctx === undefined) {
    // Fallback for components used outside provider
    return { isDark: false, toggleTheme: () => {}, setIsDark: () => {} };
  }
  return ctx;
}

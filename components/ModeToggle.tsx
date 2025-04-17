 'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering before theme is initialized to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';
  return (
    <div className="flex items-center space-x-4 p-4">
      <button
        onClick={() => setTheme('light')}
        className={
          `px-3 py-1 rounded ${
            !isDark ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
          }`
        }
      >
        Supplier
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={
          `px-3 py-1 rounded ${
            isDark ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
          }`
        }
      >
        Schreiber
      </button>
      {isDark && (
        <img
          src="https://www.appslibrary.com/images/M/1099/schreiber.png"
          alt="Schreiber Logo"
          className="h-8 w-auto"
        />
      )}
    </div>
  );
}
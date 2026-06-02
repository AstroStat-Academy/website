import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme');
  return stored === 'dark' ? 'dark' : 'light';
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-ink/10 bg-white/80 p-1 shadow-sm transition-colors hover:border-blue/30 dark:border-white/15 dark:bg-white/10"
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full bg-blue text-bone shadow-sm transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        <span aria-hidden="true" className="text-xs leading-none">
          {isDark ? '☾' : '☼'}
        </span>
      </span>
    </button>
  );
}

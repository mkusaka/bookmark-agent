import { ReactNode } from 'react';
import { ThemeToggle } from './theme-toggle';

interface PageLayoutProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  hideThemeToggle?: boolean;
}

export function PageLayout({
  title,
  description,
  actions,
  children,
  hideThemeToggle = false,
}: PageLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {!hideThemeToggle && <ThemeToggle />}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
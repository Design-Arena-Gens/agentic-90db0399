'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppShellProps = {
  title: string;
  children: ReactNode;
  className?: string;
  toolbar?: ReactNode;
};

export const AppShell = ({ title, children, className, toolbar }: AppShellProps) => {
  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-slate-400">
            Suite de التصميم الحراري لشبكات التدفئة المغلقة بالردياتورات
          </p>
        </div>
        {toolbar ? <div className="flex items-center gap-3">{toolbar}</div> : null}
      </header>
      <main className={cn('flex flex-1 overflow-hidden', className)}>{children}</main>
    </div>
  );
};

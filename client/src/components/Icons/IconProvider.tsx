import React from 'react';
import { cn } from '~/lib/utils';

interface IconProviderProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function IconProvider({ children, className, onClick }: IconProviderProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('icon', className)}
      onClick={onClick}
    >
      {children}
    </svg>
  );
}

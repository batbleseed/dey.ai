import React from 'react';
import { DeyLogo } from './DeyLogo';
import type { User } from 'firebase/auth';

interface EmptyStateProps {
  onSelectPrompt?: (promptText: string) => void;
  widthMode?: 'wide' | 'full' | 'compact';
  currentUser?: User | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  widthMode = 'wide',
  currentUser,
}) => {
  const userName = currentUser?.displayName
    || (currentUser?.email ? currentUser.email.split('@')[0] : null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 select-none my-auto w-full transition-all duration-200">
      <div
        className={`w-full flex flex-col items-center text-center transition-all duration-200 ${
          widthMode === 'full'
            ? 'w-full max-w-none px-4 sm:px-8 md:px-12'
            : widthMode === 'compact'
            ? 'w-full max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6'
            : 'w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-8'
        }`}
      >
        {/* Dey Brand Icon & Heading */}
        <DeyLogo size="xl" className="mb-4 animate-in fade-in zoom-in-90 duration-300" />

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          {userName ? `What can I help with today, ${userName}?` : 'What can I help with today?'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          Dey is ready to assist with coding, system design, creative drafting, deep logic reasoning, and workspace documents.
        </p>
      </div>
    </div>
  );
};


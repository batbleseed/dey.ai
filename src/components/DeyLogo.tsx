import React from 'react';
import deyAppIcon from '../assets/images/dey_app_icon_1788439119080.jpg';

interface DeyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  withBadge?: boolean;
}

export const DeyLogo: React.FC<DeyLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  withBadge = false,
}) => {
  const sizeMap = {
    xs: 'w-5 h-5 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const imageSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative shrink-0 overflow-hidden shadow-xs ring-1 ring-emerald-500/20 ${imageSize}`}>
        <img
          src={deyAppIcon}
          alt="Dey Icon"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold tracking-tight text-neutral-900 dark:text-neutral-100 text-base">
            Dey
          </span>
          {withBadge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              AI
            </span>
          )}
        </div>
      )}
    </div>
  );
};

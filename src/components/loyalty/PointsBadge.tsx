import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function PointsBadge({ points, size = 'md', animated = true }: PointsBadgeProps) {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-2 rounded-full 
        bg-gradient-to-r from-secondary to-accent text-white font-semibold
        shadow-lg transition-all duration-300
        hover:scale-105 active:scale-95
        ${sizeClasses[size]}
        ${animated ? 'animate-fade-scale' : ''}
      `}
    >
      <Sparkles className={iconSizes[size]} />
      <span>{points.toLocaleString()}</span>
      <span className="text-xs opacity-90">{t('common.pts')}</span>
    </div>
  );
}
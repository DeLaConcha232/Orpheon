import { motion } from 'framer-motion';
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

  const badge = (
    <div className={`
      inline-flex items-center gap-2 rounded-full 
      premium-gradient text-white font-semibold
      premium-shadow premium-transition
      ${sizeClasses[size]}
    `}>
      <Sparkles className={iconSizes[size]} />
      <span>{points.toLocaleString()}</span>
      <span className="text-xs opacity-90">{t('common.pts')}</span>
    </div>
  );

  if (!animated) return badge;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.3 }}
    >
      {badge}
    </motion.div>
  );
}
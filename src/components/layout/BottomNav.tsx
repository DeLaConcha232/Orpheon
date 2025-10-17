import { Link, useLocation } from 'react-router-dom';
import { Home, QrCode, Gift, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const getNavItems = (t: (key: string) => string) => [
  { icon: Home, label: t('nav.home'), path: '/' },
  { icon: QrCode, label: t('nav.scan'), path: '/scan' },
  { icon: Gift, label: t('nav.rewards'), path: '/rewards' },
  { icon: History, label: t('nav.history'), path: '/history' },
  { icon: User, label: t('nav.profile'), path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const navItems = getNavItems(t);

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-border/30 safe-area-pb z-50 animate-slide-up">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
            >
              <div
                className={cn(
                  "relative p-2.5 rounded-2xl transition-all duration-300 active:scale-95",
                  isActive 
                    ? "bg-secondary/15 text-secondary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div
                    className="absolute inset-0 bg-secondary/10 rounded-2xl border border-secondary/20 animate-fade-scale"
                  />
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-300",
                  isActive ? "text-secondary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
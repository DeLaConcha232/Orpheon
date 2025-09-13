import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.rewards': 'Premios',
    'nav.scan': 'Escanear',
    'nav.history': 'Historial',
    'nav.profile': 'Perfil',
    
    // Rewards
    'rewards.title': 'Catálogo de Premios',
    'rewards.subtitle': 'Canjea tus puntos',
    'rewards.redeem': 'Canjear',
    'rewards.redeeming': 'Canjeando...',
    'rewards.insufficient': 'Faltan puntos',
    'rewards.howToEarn': '¿Cómo ganar más puntos?',
    'rewards.scanCodes': 'Escanea códigos de productos',
    'rewards.buyProducts': 'Compra productos participantes',
    'rewards.promotions': 'Participa en promociones especiales',
    
    // Profile
    'profile.title': 'Mi Perfil',
    'profile.language': 'Idioma',
    'profile.spanish': 'Español',
    'profile.english': 'English',
    'profile.personalInfo': 'Información Personal',
    'profile.accountStats': 'Estadísticas de Cuenta',
    'profile.signOut': 'Cerrar Sesión',
    'profile.totalPoints': 'Puntos Totales',
    'profile.memberSince': 'Miembro desde',
    
    // Common
    'common.loading': 'Cargando...',
    'common.points': 'puntos',
    'common.pts': 'pts',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.rewards': 'Rewards',
    'nav.scan': 'Scan',
    'nav.history': 'History',
    'nav.profile': 'Profile',
    
    // Rewards
    'rewards.title': 'Rewards Catalog',
    'rewards.subtitle': 'Redeem your points',
    'rewards.redeem': 'Redeem',
    'rewards.redeeming': 'Redeeming...',
    'rewards.insufficient': 'Not enough points',
    'rewards.howToEarn': 'How to earn more points?',
    'rewards.scanCodes': 'Scan product codes',
    'rewards.buyProducts': 'Buy participating products',
    'rewards.promotions': 'Participate in special promotions',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.language': 'Language',
    'profile.spanish': 'Español',
    'profile.english': 'English',
    'profile.personalInfo': 'Personal Information',
    'profile.accountStats': 'Account Statistics',
    'profile.signOut': 'Sign Out',
    'profile.totalPoints': 'Total Points',
    'profile.memberSince': 'Member since',
    
    // Common
    'common.loading': 'Loading...',
    'common.points': 'points',
    'common.pts': 'pts',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
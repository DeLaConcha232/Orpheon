import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { PWAInstall } from '@/components/ui/PWAInstall';
import Logotipo from "/Logotipo.png"

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 flex flex-col items-center justify-center"
        >
          <img src={Logotipo} alt="Logotipo" className="w-40 h-auto"/>
          <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
            Orpheon
          </h1>
          <p className="text-muted-foreground">
            Tu programa de lealtad
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AuthForm mode={mode} onModeChange={setMode} />
        </motion.div>
        
        <PWAInstall />
      </div>
    </div>
  );
}
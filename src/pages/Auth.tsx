import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { PWAInstall } from '@/components/ui/PWAInstall';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const { user, loading } = useAuth();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background premium-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background premium-bg p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-heading font-bold premium-gradient bg-clip-text text-transparent mb-2">
            Nectar Loyalty
          </h1>
          <p className="text-muted-foreground">
            Tu programa de lealtad premium
          </p>
        </motion.div>
        
        <AuthForm mode={mode} onModeChange={setMode} />
        
        <PWAInstall />
      </div>
    </div>
  );
}
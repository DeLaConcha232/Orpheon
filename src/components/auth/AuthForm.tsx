import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'forgot';
  onModeChange: (mode: 'signin' | 'signup' | 'forgot') => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  // Enhanced input validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "La contraseña debe tener al menos 8 caracteres" };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos una letra minúscula" };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos una letra mayúscula" };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos un número" };
    }
    return { valid: true };
  };

  const validateFullName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation before submission
    if (!validateEmail(email)) {
      return; // Email validation will show error in real-time
    }

    if (mode === 'signup') {
      if (!validateFullName(fullName)) {
        return; // Name validation will show error in real-time
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return; // Password validation will show error in real-time
      }
    } else if (mode === 'signin' && password.length === 0) {
      return; // Password required for signin
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password, fullName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Inicia Sesión';
      case 'signup': return 'Crear Cuenta';
      case 'forgot': return 'Recuperar Contraseña';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'signin': return 'Accede a tu cuenta de Orpheon';
      case 'signup': return 'Únete a nuestro programa de lealtad premium';
      case 'forgot': return 'Te enviaremos un enlace para restablecer tu contraseña';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="loyalty-card border-0 premium-bg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-heading font-bold text-primary">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={`rounded-xl border-border/50 focus:border-secondary ${
                    fullName && !validateFullName(fullName) ? 'border-red-500' : ''
                  }`}
                />
                {fullName && !validateFullName(fullName) && (
                  <p className="text-xs text-red-500">
                    El nombre debe tener al menos 2 caracteres y solo contener letras
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`rounded-xl border-border/50 focus:border-secondary ${
                  email && !validateEmail(email) ? 'border-red-500' : ''
                }`}
              />
              {email && !validateEmail(email) && (
                <p className="text-xs text-red-500">
                  Por favor ingresa un email válido
                </p>
              )}
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`rounded-xl border-border/50 focus:border-secondary ${
                    mode === 'signup' && password && !validatePassword(password).valid ? 'border-red-500' : ''
                  }`}
                />
                {mode === 'signup' && password && !validatePassword(password).valid && (
                  <p className="text-xs text-red-500">
                    {validatePassword(password).message}
                  </p>
                )}
                {mode === 'signup' && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>La contraseña debe contener:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={password.length >= 8 ? 'text-green-600' : ''}>
                        Al menos 8 caracteres
                      </li>
                      <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>
                        Una letra minúscula
                      </li>
                      <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>
                        Una letra mayúscula
                      </li>
                      <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>
                        Un número
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <CustomButton
              type="submit"
              variant="premium"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Procesando...' : getTitle()}
            </CustomButton>
          </form>

          <div className="mt-6">
            <Separator className="my-4" />
            
            <div className="text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => onModeChange('signup')}
                      className="text-secondary hover:text-secondary/80 font-medium"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ¿Olvidaste tu contraseña?{' '}
                    <button
                      type="button"
                      onClick={() => onModeChange('forgot')}
                      className="text-accent hover:text-accent/80 font-medium"
                    >
                      Recupérala
                    </button>
                  </p>
                </>
              )}
              
              {mode === 'signup' && (
                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange('signin')}
                    className="text-secondary hover:text-secondary/80 font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
              
              {mode === 'forgot' && (
                <p className="text-sm text-muted-foreground">
                  ¿Recordaste tu contraseña?{' '}
                  <button
                    type="button"
                    onClick={() => onModeChange('signin')}
                    className="text-secondary hover:text-secondary/80 font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
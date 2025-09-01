import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Camera, Type, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RedemptionResponse {
  success: boolean;
  error?: string;
  points_earned?: number;
  product_name?: string;
  new_total_points?: number;
}

export default function Scan() {
  const { user, loading } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
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

  const handleScanCode = async (code: string) => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código válido",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);

    try {
      // Use the secure redeem_product_code function
      const { data, error } = await supabase.rpc('redeem_product_code', {
        code_value_input: code.trim().toUpperCase()
      });

      if (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al procesar el código",
          variant: "destructive",
        });
        return;
      }

      const result = data as unknown as RedemptionResponse;

      if (!result.success) {
        toast({
          title: "Código inválido",
          description: result.error || "Código inválido",
          variant: "destructive",
        });
        return;
      }

      // Show success with confetti effect
      toast({
        title: "¡Código canjeado!",
        description: `Ganaste ${result.points_earned} puntos por ${result.product_name}`,
        variant: "default",
      });

      setManualCode('');

    } catch (error) {
      console.error('Code redemption error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el código",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background premium-bg pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-gradient p-6 text-white"
      >
        <div className="text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold">Escanear Código</h1>
          <p className="text-white/80">Gana puntos por tus productos</p>
        </div>
      </motion.header>

      <div className="p-6 space-y-6">
        {/* QR Scanner (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="loyalty-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Camera className="w-5 h-5 text-secondary" />
                Escáner de Cámara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl flex items-center justify-center mb-4 scanner-overlay">
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Función de cámara próximamente</p>
                </div>
              </div>
              <CustomButton
                variant="outline"
                className="w-full"
                disabled
              >
                <Camera className="w-4 h-4 mr-2" />
                Activar Cámara
              </CustomButton>
            </CardContent>
          </Card>
        </motion.div>

        {/* Manual Code Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="loyalty-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Type className="w-5 h-5 text-accent" />
                Código Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Ingresa tu código (ej: CODE-000001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Encuentra el código en el empaque de tu producto
                </p>
              </div>
              
              <CustomButton
                variant="premium"
                size="lg"
                className="w-full"
                onClick={() => handleScanCode(manualCode)}
                disabled={scanning || !manualCode.trim()}
              >
                {scanning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Canjear Código
                  </>
                )}
              </CustomButton>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="loyalty-card border-0 premium-bg">
            <CardHeader>
              <CardTitle className="text-foreground">¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary text-white text-xs flex items-center justify-center font-bold mt-1">1</div>
                <div>
                  <p className="font-medium text-foreground">Compra productos Nectar</p>
                  <p className="text-sm text-muted-foreground">Busca nuestros productos en tiendas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold mt-1">2</div>
                <div>
                  <p className="font-medium text-foreground">Encuentra el código</p>
                  <p className="text-sm text-muted-foreground">Revisa el empaque del producto</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-success text-white text-xs flex items-center justify-center font-bold mt-1">3</div>
                <div>
                  <p className="font-medium text-foreground">Escanea y gana</p>
                  <p className="text-sm text-muted-foreground">Acumula puntos y canjea premios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
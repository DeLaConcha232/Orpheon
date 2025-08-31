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
      // Check if code exists and is not used
      const { data: codeData, error: codeError } = await supabase
        .from('product_codes')
        .select('*, products(name, points_value)')
        .eq('code_value', code.trim().toUpperCase())
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        toast({
          title: "Código inválido",
          description: "El código no existe o ya fue utilizado",
          variant: "destructive",
        });
        return;
      }

      // Mark code as used and assign to user
      const { error: updateError } = await supabase
        .from('product_codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq('id', codeData.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "No se pudo procesar el código",
          variant: "destructive",
        });
        return;
      }

      // Add redemption record
      const { error: redemptionError } = await supabase
        .from('user_redemptions')
        .insert({
          user_id: user.id,
          code_id: codeData.id,
          points_earned: codeData.products.points_value
        });

      if (redemptionError) {
        console.error('Redemption error:', redemptionError);
      }

      // Update user points
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          points: (await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single()).data?.points + codeData.products.points_value || codeData.products.points_value
        })
        .eq('id', user.id);

      if (pointsError) {
        console.error('Points update error:', pointsError);
      }

      toast({
        title: "¡Código canjeado!",
        description: `Ganaste ${codeData.products.points_value} puntos por ${codeData.products.name}`,
        variant: "default",
      });

      setManualCode('');

    } catch (error) {
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
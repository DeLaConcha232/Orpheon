import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQRCamera } from '@/hooks/useQRCamera';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Sparkles, X } from 'lucide-react';
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
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRedemptionAttemptRef = useRef<number>(0);
  
  const { 
    isScanning, 
    error: cameraError, 
    videoRef, 
    canvasRef, 
    startCamera, 
    stopCamera, 
    scanQRCode,
    processImage 
  } = useQRCamera();
  
  const { sendLocalNotification } = usePushNotifications();

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
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

  const handleScanCode = async (code: string) => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código válido",
        variant: "destructive",
      });
      return;
    }

    if (trimmedCode.length < 5 || !/^[A-Z0-9\-]+$/.test(trimmedCode)) {
      toast({
        title: "Formato inválido",
        description: "El código debe contener solo letras, números y guiones",
        variant: "destructive",
      });
      return;
    }

    if (Date.now() - lastRedemptionAttemptRef.current < 2000) {
      toast({
        title: "Demasiado rápido",
        description: "Espera un momento antes de intentar otro código",
        variant: "destructive",
      });
      return;
    }

    lastRedemptionAttemptRef.current = Date.now();
    setScanning(true);

    try {
      const { data, error } = await supabase.rpc('redeem_product_code', {
        code_value_input: trimmedCode
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

      toast({
        title: "¡Código canjeado!",
        description: `Ganaste ${result.points_earned} puntos por ${result.product_name}`,
        variant: "default",
      });

      sendLocalNotification(
        "¡Puntos ganados!",
        `Ganaste ${result.points_earned} puntos por ${result.product_name}`
      );

      setManualCode('');
      setShowCamera(false);
      stopCamera();

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

  const handleStartCamera = async () => {
    setShowCamera(true);
    const dataUrl = await startCamera();
    
    if (dataUrl) {
      const code = await processImage(dataUrl);
      if (code) {
        await handleScanCode(code);
      }
    } else {
      scanIntervalRef.current = setInterval(() => {
        const code = scanQRCode();
        if (code) {
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
          }
          handleScanCode(code);
        }
      }, 500);
    }
  };

  const handleStopCamera = () => {
    setShowCamera(false);
    stopCamera();
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle pb-24">
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-heading font-bold mb-2">Escanear Código</h1>
          <p className="text-muted-foreground">Gana puntos al instante</p>
        </motion.div>

        {/* Camera Scanner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="floating-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-secondary" />
                Escáner de Cámara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showCamera ? (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="aspect-square bg-black rounded-2xl overflow-hidden relative">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-secondary/50 rounded-2xl relative">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-2xl"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-2xl"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-2xl"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-2xl"></div>
                          
                          <motion.div
                            animate={{ y: [0, 192, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"
                          />
                        </div>
                      </div>

                      {cameraError && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
                          <p className="text-white text-center text-sm">{cameraError}</p>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="destructive"
                      className="w-full rounded-2xl"
                      onClick={handleStopCamera}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cerrar Cámara
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="aspect-square rounded-2xl bg-muted/30 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Toca para activar</p>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      onClick={handleStartCamera}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                          />
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Activar Cámara
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Manual Code Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="floating-card">
            <CardHeader>
              <CardTitle>Código Manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ingresa tu código (ej: CODE-000001)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg tracking-wider rounded-2xl"
              />
              
              <Button
                className="w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
                onClick={() => handleScanCode(manualCode)}
                disabled={scanning || !manualCode.trim()}
              >
                {scanning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                    />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Canjear Código
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}

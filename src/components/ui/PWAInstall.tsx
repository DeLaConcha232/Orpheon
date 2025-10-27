import React, { useState } from 'react';
import { Apple, Smartphone, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';

export function PWAInstall() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'desktop'>('ios');

  const platforms = [
    { id: 'ios', name: 'iOS', icon: Apple },
    { id: 'android', name: 'Android', icon: Smartphone },
    { id: 'desktop', name: 'Desktop', icon: Globe }
  ];

  const instructions = {
    ios: [
      'Abre esta página en Safari',
      'Toca el botón "Compartir" (cuadrado con flecha)',
      'Desliza hacia abajo y toca "Añadir a pantalla de inicio"',
      'Toca "Añadir" en la esquina superior derecha'
    ],
    android: [
      'Abre esta página en Chrome',
      'Toca el menú (⋮) en la esquina superior derecha',
      'Selecciona "Añadir a pantalla de inicio"',
      'Confirma tocando "Añadir"'
    ],
    desktop: [
      'Abre esta página en Chrome, Edge o Firefox',
      'Busca el ícono de instalación en la barra de direcciones',
      'Haz clic en "Instalar aplicación"',
      'Confirma la instalación'
    ]
  };

  const handlePlatformSelect = (platform: 'ios' | 'android' | 'desktop') => {
    setSelectedPlatform(platform);
    setShowPopup(true);
  };

  return (
    <>
      <div className="flex justify-center gap-4 mt-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <motion.button
              key={platform.id}
              onClick={() => handlePlatformSelect(platform.id as any)}
              className="w-12 h-12 bg-card/80 backdrop-blur-sm hover:bg-card border border-border rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: platform.id === 'ios' ? 0.1 : platform.id === 'android' ? 0.2 : 0.3 }}
            >
              <Icon className="w-6 h-6 text-foreground" />
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Instalar como aplicación
      </p>

      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="loyalty-card border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      {platforms.find(p => p.id === selectedPlatform)?.icon && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          {React.createElement(platforms.find(p => p.id === selectedPlatform)!.icon, { className: "w-5 h-5" })}
                        </div>
                      )}
                      Instalar en {platforms.find(p => p.id === selectedPlatform)?.name}
                    </CardTitle>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Instala la app Orpheon para una mejor experiencia:
                  </p>
                  
                  <div className="space-y-3">
                    {instructions[selectedPlatform].map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-secondary">{index + 1}</span>
                        </div>
                        <p className="text-sm text-foreground">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <CustomButton
                      onClick={() => setShowPopup(false)}
                      className="w-full"
                      variant="premium"
                    >
                      Entendido
                    </CustomButton>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
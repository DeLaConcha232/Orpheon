import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Gift, Package, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  points_value: number;
  image_url: string;
  category: string;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(3)
        .order('created_at', { ascending: false });

      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user!.id)
        .single();

      setProducts(productsData || []);
      setUserPoints(profileData?.points || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

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

  return (
    <div className="min-h-screen gradient-subtle pb-24">
      {/* Header */}
      <div className="p-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold mb-1">
              Hola 👋
            </h1>
            <p className="text-muted-foreground">
              {user?.user_metadata?.full_name || 'Usuario'}
            </p>
          </div>
          <PointsBadge points={userPoints} size="lg" />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <Link to="/scan">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="floating-card p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-1">Escanear</h3>
              <p className="text-xs text-muted-foreground">Gana puntos</p>
            </motion.div>
          </Link>
          
          <Link to="/rewards">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="floating-card p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Premios</h3>
              <p className="text-xs text-muted-foreground">Canjea ahora</p>
            </motion.div>
          </Link>
        </motion.div>

        {/* Featured Products */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">
              Productos Destacados
            </h2>
            <Sparkles className="w-5 h-5 text-secondary" />
          </div>
          
          <div className="space-y-3">
            {loadingData ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full mx-auto"
                />
              </div>
            ) : products.length === 0 ? (
              <Card className="floating-card">
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Próximamente</h3>
                  <p className="text-sm text-muted-foreground">Los productos aparecerán aquí</p>
                </CardContent>
              </Card>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="floating-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <PointsBadge points={product.points_value} size="sm" animated={false} />
                            {product.category && (
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                {product.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="floating-card">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">¿Cómo funciona?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-secondary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Compra productos</p>
                    <p className="text-xs text-muted-foreground">Busca nuestros productos en tiendas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Escanea códigos</p>
                    <p className="text-xs text-muted-foreground">Encuentra el código en el empaque</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-success">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Gana premios</p>
                    <p className="text-xs text-muted-foreground">Acumula puntos y canjea recompensas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;

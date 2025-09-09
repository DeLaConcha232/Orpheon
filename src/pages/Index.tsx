import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { CustomButton } from '@/components/ui/custom-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Gift, History, Sparkles, Star, Users, Package } from 'lucide-react';
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
      // Fetch featured products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(3)
        .order('created_at', { ascending: false });

      // Fetch user profile for points
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

  // Redirect to auth if not authenticated
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

  return (
    <div className="min-h-screen bg-background premium-bg pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-gradient p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">
              ¡Hola, {user?.user_metadata?.full_name || 'Usuario'}!
            </h1>
            <p className="text-white/80">Bienvenido a Nectar Loyalty</p>
          </div>
          <PointsBadge points={userPoints} size="lg" />
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4 text-foreground">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/scan">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="loyalty-card p-6 text-center bg-gradient-to-br from-secondary/10 to-secondary/5"
              >
                <QrCode className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <h3 className="font-semibold text-foreground">Escanear Código</h3>
                <p className="text-sm text-muted-foreground mt-1">Gana puntos</p>
              </motion.div>
            </Link>
            
            <Link to="/rewards">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="loyalty-card p-6 text-center bg-gradient-to-br from-accent/10 to-accent/5"
              >
                <Gift className="w-8 h-8 mx-auto mb-3 text-accent" />
                <h3 className="font-semibold text-foreground">Ver Premios</h3>
                <p className="text-sm text-muted-foreground mt-1">Canjea puntos</p>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        {/* Featured Products */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold mb-4 text-foreground">
            Productos Destacados
          </h2>
          <div className="space-y-4">
            {loadingData ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full mx-auto"
                />
              </div>
            ) : products.length === 0 ? (
              <Card className="loyalty-card border-0">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground mb-2">No hay productos disponibles</h3>
                  <p className="text-sm text-muted-foreground">Los productos se mostrarán aquí cuando estén disponibles</p>
                </CardContent>
              </Card>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="loyalty-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-secondary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <PointsBadge points={product.points_value} size="sm" animated={false} />
                            <span className="text-xs text-muted-foreground">por código</span>
                            {product.category && (
                              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
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

        {/* Program Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="loyalty-card border-0 premium-bg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-secondary" />
                Beneficios del Programa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">Acumula puntos con cada compra</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">Canjea premios exclusivos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Acceso a ofertas especiales</span>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;

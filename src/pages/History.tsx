import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History as HistoryIcon, Plus, Minus, Calendar, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Redemption {
  id: string;
  points_earned: number;
  redeemed_at: string;
  product_codes: {
    code_value: string;
    products: {
      name: string;
      category: string;
    };
  };
}

interface Reward {
  id: string;
  reward_type: string;
  points_cost: number;
  redeemed_at: string;
  status: string;
}

export default function History() {
  const { user, loading } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('redeemed-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redeemed_rewards',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Reward change detected:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setRewards(prev => prev.map(reward => 
              reward.id === payload.new.id 
                ? { ...reward, ...payload.new }
                : reward
            ));
          } else if (payload.eventType === 'INSERT') {
            setRewards(prev => [payload.new as Reward, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchHistory = async () => {
    setLoadingData(true);
    
    try {
      // Fetch code redemptions
      const { data: redemptionsData } = await supabase
        .from('user_redemptions')
        .select(`
          id,
          points_earned,
          redeemed_at,
          product_codes!inner(
            code_value,
            products!inner(name, category)
          )
        `)
        .eq('user_id', user!.id)
        .order('redeemed_at', { ascending: false });

      // Fetch reward redemptions
      const { data: rewardsData } = await supabase
        .from('redeemed_rewards')
        .select('*')
        .eq('user_id', user!.id)
        .order('redeemed_at', { ascending: false });

      setRedemptions(redemptionsData || []);
      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gomitas': return 'bg-secondary/20 text-secondary';
      case 'galletas': return 'bg-accent/20 text-accent';
      case 'cremas': return 'bg-success/20 text-success';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'entregado':
      case 'aceptado': 
        return 'bg-success/20 text-success';
      case 'pending':
      case 'pendiente': 
        return 'bg-warning/20 text-warning';
      case 'cancelled':
      case 'cancelado': 
        return 'bg-destructive/20 text-destructive';
      default: 
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'entregado': 
        return 'Entregado';
      case 'aceptado': 
        return 'Aceptado';
      case 'pending':
      case 'pendiente': 
        return 'Pendiente';
      case 'cancelled':
      case 'cancelado': 
        return 'Cancelado';
      default: 
        return status || 'Desconocido';
    }
  };

  if (loading || loadingData) {
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
        <div className="text-center">
          <HistoryIcon className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold">Mi Historial</h1>
          <p className="text-white/80">Revisa tu actividad</p>
        </div>
      </motion.header>

      <div className="p-6">
        <Tabs defaultValue="earned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="earned" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Puntos Ganados
            </TabsTrigger>
            <TabsTrigger value="spent" className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Premios Canjeados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-4">
            {redemptions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay actividad</h3>
                <p className="text-muted-foreground">Escanea tu primer código para empezar</p>
              </motion.div>
            ) : (
              redemptions.map((redemption, index) => (
                <motion.div
                  key={redemption.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="loyalty-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center">
                            <Plus className="w-6 h-6 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {redemption.product_codes.products.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(redemption.product_codes.products.category)}`}>
                                {redemption.product_codes.products.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {redemption.product_codes.code_value}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(redemption.redeemed_at)}
                            </div>
                          </div>
                        </div>
                        <PointsBadge points={redemption.points_earned} size="sm" animated={false} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="spent" className="space-y-4">
            {rewards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hay canjes</h3>
                <p className="text-muted-foreground">Visita la sección de premios para canjear</p>
              </motion.div>
            ) : (
              rewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="loyalty-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
                            <Minus className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{reward.reward_type}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reward.status)}`}>
                                {getStatusLabel(reward.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(reward.redeemed_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <PointsBadge points={-reward.points_cost} size="sm" animated={false} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
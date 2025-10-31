import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { Card, CardContent } from '@/components/ui/card';
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

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    
    try {
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
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      const { data: rewardsData } = await supabase
        .from('redeemed_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      setRedemptions(redemptionsData || []);
      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

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

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        return status || 'Pendiente';
    }
  };

  if (loading || loadingData) {
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
      <div className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-heading font-bold mb-2">Mi Historial</h1>
          <p className="text-muted-foreground">Revisa tu actividad</p>
        </motion.div>

        <Tabs defaultValue="earned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 glass-card p-1">
            <TabsTrigger value="earned" className="rounded-2xl data-[state=active]:bg-secondary/20">
              <Plus className="w-4 h-4 mr-2" />
              Ganados
            </TabsTrigger>
            <TabsTrigger value="spent" className="rounded-2xl data-[state=active]:bg-accent/20">
              <Minus className="w-4 h-4 mr-2" />
              Canjeados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-3">
            {redemptions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="floating-card">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No hay actividad</h3>
                    <p className="text-sm text-muted-foreground">Escanea tu primer código para empezar</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              redemptions.map((redemption, index) => (
                <motion.div
                  key={redemption.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="floating-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Plus className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {redemption.product_codes.products.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                              {redemption.product_codes.products.category}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {redemption.product_codes.code_value}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(redemption.redeemed_at)}
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

          <TabsContent value="spent" className="space-y-3">
            {rewards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="floating-card">
                  <CardContent className="p-12 text-center">
                    <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No hay canjes</h3>
                    <p className="text-sm text-muted-foreground">Visita la sección de premios para canjear</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              rewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="floating-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Minus className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{reward.reward_type}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {getStatusLabel(reward.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(reward.redeemed_at)}
                          </div>
                        </div>
                        <PointsBadge points={-reward.points_cost} size="sm" animated={false} />
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

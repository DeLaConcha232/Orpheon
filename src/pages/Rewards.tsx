import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { CustomButton } from '@/components/ui/custom-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Star, Coffee, ShoppingBag, Crown, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  points: number;
}

interface RewardType {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}



export default function Rewards() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rewards, setRewards] = useState<RewardType[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRewards();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user!.id)
      .single();
    
    setUserProfile(data);
  };

  const fetchRewards = async () => {
    setLoadingRewards(true);
    
    try {
      // For now, use static data until we create a proper database function
      const staticRewards: RewardType[] = [
        {
          id: '1',
          name: 'Descuento 10%',
          description: 'En tu próxima compra',
          points_cost: 100,
          is_active: true
        },
        {
          id: '2',
          name: 'Producto Gratis',
          description: 'Gomitas o galletas',
          points_cost: 200,
          is_active: true
        },
        {
          id: '3',
          name: 'Café Premium',
          description: 'En café partner',
          points_cost: 150,
          is_active: true
        },
        {
          id: '4',
          name: 'Pack Exclusivo',
          description: 'Productos premium',
          points_cost: 500,
          is_active: true
        }
      ];
      setRewards(staticRewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las recompensas",
        variant: "destructive",
      });
    } finally {
      setLoadingRewards(false);
    }
  };


  const handleRedeem = async (reward: RewardType) => {
    if (!userProfile || userProfile.points < reward.points_cost) {
      toast({
        title: "Puntos insuficientes",
        description: "No tienes puntos suficientes para reclamar esta recompensa.",
        variant: "destructive",
      });
      return;
    }
    
    setRedeeming(reward.id);
    
    try {
      // Check if user has enough points (double check)
      if (userProfile.points < reward.points_cost) {
        toast({
          title: "Puntos insuficientes",
          description: "No tienes puntos suficientes para reclamar esta recompensa.",
          variant: "destructive",
        });
        return;
      }

      // Add to redeemed rewards
      const { error: redeemError } = await supabase
        .from('redeemed_rewards')
        .insert({
          user_id: user!.id,
          reward_type: reward.name,
          points_cost: reward.points_cost,
          status: 'claimed'
        });

      if (redeemError) {
        console.error('Error saving redemption:', redeemError);
        toast({
          title: "Error",
          description: "Hubo un problema al procesar tu recompensa.",
          variant: "destructive",
        });
        return;
      }

      // Update user points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: userProfile.points - reward.points_cost
        })
        .eq('id', user!.id);

      if (updateError) {
        console.error('Error updating points:', updateError);
        toast({
          title: "Error",
          description: "Hubo un problema al actualizar tus puntos.",
          variant: "destructive",
        });
        return;
      }

      // Success! Refresh profile and show success message
      await fetchUserProfile();
      
      toast({
        title: "¡Recompensa reclamada!",
        description: `Has reclamado ${reward.name} por ${reward.points_cost} puntos.`,
        variant: "default",
      });

    } catch (error) {
      console.error('Redeem error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu recompensa.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getRewardIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('descuento')) return ShoppingBag;
    if (lowerName.includes('café') || lowerName.includes('coffee')) return Coffee;
    if (lowerName.includes('premium') || lowerName.includes('exclusivo')) return Crown;
    return Gift;
  };

  const getRewardColor = (index: number) => {
    const colors = [
      'from-secondary/20 to-secondary/10',
      'from-accent/20 to-accent/10',
      'from-success/20 to-success/10',
      'from-amber-500/20 to-amber-400/10'
    ];
    return colors[index % colors.length];
  };

  if (loading || loadingRewards) {
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
          <Gift className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold">{t('rewards.title')}</h1>
          <p className="text-white/80">{t('rewards.subtitle')}</p>
          <div className="mt-4">
            <PointsBadge points={userProfile?.points || 0} size="lg" />
          </div>
        </div>
      </motion.header>

      <div className="p-6 space-y-6">
        {/* Rewards Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid gap-4">
            {rewards.map((reward, index) => {
              const Icon = getRewardIcon(reward.name);
              const canRedeem = userProfile && userProfile.points >= reward.points_cost;
              const isRedeeming = redeeming === reward.id;
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card className={`loyalty-card border-0 ${!canRedeem ? 'opacity-75' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {reward.image_url ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden">
                            <img 
                              src={reward.image_url} 
                              alt={reward.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 bg-gradient-to-br ${getRewardColor(index)} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-8 h-8 text-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{reward.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <PointsBadge points={reward.points_cost} size="sm" animated={false} />
                            
                            <CustomButton
                              variant={canRedeem ? "premium" : "outline"}
                              size="sm"
                              onClick={() => handleRedeem(reward)}
                              disabled={!canRedeem || isRedeeming}
                            >
                              {isRedeeming ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 border border-white border-t-transparent rounded-full mr-1"
                                  />
                                  {t('rewards.redeeming')}
                                </>
                              ) : canRedeem ? (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {t('rewards.redeem')}
                                </>
                              ) : (
                                t('rewards.insufficient')
                              )}
                            </CustomButton>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Points Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="loyalty-card border-0 premium-bg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Star className="w-5 h-5 text-secondary" />
                {t('rewards.howToEarn')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">{t('rewards.scanCodes')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-muted-foreground">{t('rewards.buyProducts')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">{t('rewards.promotions')}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
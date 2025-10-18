import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { PointsBadge } from "@/components/loyalty/PointsBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Coffee, ShoppingBag, Crown, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  points: number;
}

interface RewardType {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
    const { data } = await supabase.from("profiles").select("points").eq("id", user!.id).single();

    setUserProfile(data);
  };

  const fetchRewards = async () => {
    setLoadingRewards(true);

    try {
      const { data, error } = await supabase
        .from("reward_types")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });

      if (error) {
        console.error("Error fetching rewards:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las recompensas",
          variant: "destructive",
        });
        return;
      }

      setRewards(data || []);
    } catch (error) {
      console.error("Error loading rewards:", error);
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
      if (userProfile.points < reward.points_cost) {
        toast({
          title: "Puntos insuficientes",
          description: "No tienes puntos suficientes para reclamar esta recompensa.",
          variant: "destructive",
        });
        return;
      }

      const { error: redeemError } = await supabase.from("redeemed_rewards").insert({
        user_id: user!.id,
        reward_type: reward.name,
        points_cost: reward.points_cost,
        status: "claimed",
      });

      if (redeemError) {
        console.error("Error saving redemption:", redeemError);
        toast({
          title: "Error",
          description: "Hubo un problema al procesar tu recompensa.",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          points: userProfile.points - reward.points_cost,
        })
        .eq("id", user!.id);

      if (updateError) {
        console.error("Error updating points:", updateError);
        toast({
          title: "Error",
          description: "Hubo un problema al actualizar tus puntos.",
          variant: "destructive",
        });
        return;
      }

      await fetchUserProfile();

      toast({
        title: "¡Recompensa reclamada!",
        description: `Has reclamado ${reward.name} por ${reward.points_cost} puntos.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Redeem error:", error);
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
    if (lowerName.includes("descuento")) return ShoppingBag;
    if (lowerName.includes("café") || lowerName.includes("coffee")) return Coffee;
    if (lowerName.includes("premium") || lowerName.includes("exclusivo")) return Crown;
    return Gift;
  };

  if (loading || loadingRewards) {
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">{t("rewards.title")}</h1>
          <p className="text-muted-foreground mb-4">{t("rewards.subtitle")}</p>
          <PointsBadge points={userProfile?.points || 0} size="lg" />
        </motion.div>

        {/* Rewards Grid */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <Card className="floating-card">
                <CardContent className="p-12 text-center">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Próximamente</h3>
                  <p className="text-sm text-muted-foreground">Los premios estarán disponibles pronto</p>
                </CardContent>
              </Card>
            ) : (
              rewards.map((reward, index) => {
                const Icon = getRewardIcon(reward.name);
                const canRedeem = userProfile && userProfile.points >= reward.points_cost;
                const isRedeeming = redeeming === reward.id;

                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`floating-card ${!canRedeem ? "opacity-60" : ""}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {reward.image_url ? (
                            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                              <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-10 h-10 text-secondary" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{reward.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {reward.description || "Sin descripción"}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <PointsBadge points={reward.points_cost} size="sm" animated={false} />

                              <Button
                                className={`rounded-2xl ${canRedeem ? "bg-accent text-accent-foreground hover:bg-accent/90 truncate" : ""}`}
                                variant={canRedeem ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleRedeem(reward)}
                                disabled={!canRedeem || isRedeeming}
                              >
                                {isRedeeming ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1"
                                    />
                                    {t("rewards.redeeming")}
                                  </>
                                ) : canRedeem ? (
                                  <>
                                    {/* <Sparkles className="w-3 h-3 mr-1" /> */}
                                    {t("rewards.redeem")}
                                  </>
                                ) : (
                                  t("rewards.insufficient")
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="floating-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold">{t("rewards.howToEarn")}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-secondary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{t("rewards.scanCodes")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{t("rewards.buyProducts")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-success">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{t("rewards.promotions")}</p>
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

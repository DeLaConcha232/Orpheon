import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/layout/BottomNav";
import { PointsBadge } from "@/components/loyalty/PointsBadge";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Gift, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import peanutButterJar from "@/assets/peanut-butter-jar.png";
import chocolateCookie from "@/assets/chocolate-cookie.png";
import energyGummies from "@/assets/energy-gummies.png";

interface Product {
  id: string;
  name: string;
  description: string;
  points_value: number;
  image_url: string;
  category: string;
}

const getProductIcon = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("cacahuate") || lowerName.includes("peanut")) return peanutButterJar;
  if (lowerName.includes("galleta") || lowerName.includes("nutella") || lowerName.includes("cookie")) return chocolateCookie;
  if (lowerName.includes("gomita") || lowerName.includes("gummies") || lowerName.includes("energética")) return energyGummies;
  return null;
};

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
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(3)
        .order("created_at", { ascending: false });

      const { data: profileData } = await supabase.from("profiles").select("points").eq("id", user!.id).single();

      setProducts(productsData || []);
      setUserPoints(profileData?.points || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
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
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle pb-24">
      {/* Header */}
      <div className="p-6 pb-8">
        <div className="flex items-center justify-between mb-8 animate-fade-scale">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-1">Hola 👋</h1>
            <p className="text-muted-foreground">{user?.user_metadata?.full_name || "Usuario"}</p>
          </div>
          <PointsBadge points={userPoints} size="lg" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-scale">
          <Link to="/scan">
            <div className="floating-card p-6 text-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-1">Escanear</h3>
              <p className="text-xs text-muted-foreground">Gana puntos</p>
            </div>
          </Link>

          <Link to="/rewards">
            <div className="floating-card p-6 text-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Premios</h3>
              <p className="text-xs text-muted-foreground">Canjea ahora</p>
            </div>
          </Link>
        </div>

        {/* Featured Products */}
        <section className="animate-fade-scale">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Productos Destacados</h2>
            <Sparkles className="w-5 h-5 text-secondary" />
          </div>

          <div className="space-y-3">
            {loadingData ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
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
              products.map((product) => (
                <div key={product.id} className="animate-fade-scale">
                  <Card className="floating-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url || getProductIcon(product.name) ? (
                            <img
                              src={product.image_url || getProductIcon(product.name)!}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{product.description}</p>
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
                </div>
              ))
            )}
          </div>
        </section>

        {/* Info Card */}
        <div className="mt-6 animate-fade-scale">
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
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;

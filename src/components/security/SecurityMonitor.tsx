import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Clock, User, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RedemptionAttempt {
  id: string;
  code_value: string;
  attempt_type: string;
  created_at: string;
  user_id: string;
}

interface SecurityStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  rateLimitedAttempts: number;
  suspiciousAttempts: number;
}

export function SecurityMonitor() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<RedemptionAttempt[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    rateLimitedAttempts: 0,
    suspiciousAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRedemptionAttempts();
    }
  }, [user]);

  const fetchRedemptionAttempts = async () => {
    try {
      // Fetch user's redemption attempts (last 50)
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("redemption_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
        return;
      }

      setAttempts(attemptsData || []);

      // Calculate stats
      const totalAttempts = attemptsData?.length || 0;
      const successfulAttempts = attemptsData?.filter((a) => a.attempt_type === "success").length || 0;
      const failedAttempts =
        attemptsData?.filter((a) =>
          ["invalid_code", "already_used", "expired", "invalid_format"].includes(a.attempt_type),
        ).length || 0;
      const rateLimitedAttempts = attemptsData?.filter((a) => a.attempt_type === "rate_limited").length || 0;
      const suspiciousAttempts = attemptsData?.filter((a) => a.attempt_type === "suspicious").length || 0;

      setStats({
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        rateLimitedAttempts,
        suspiciousAttempts,
      });
    } catch (error) {
      console.error("Error in fetchRedemptionAttempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptBadge = (attemptType: string) => {
    switch (attemptType) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Exitoso</Badge>;
      case "invalid_code":
        return <Badge variant="secondary">Código Inválido</Badge>;
      case "already_used":
        return <Badge variant="secondary">Ya Usado</Badge>;
      case "expired":
        return <Badge variant="secondary">Expirado</Badge>;
      case "rate_limited":
        return <Badge variant="destructive">Límite Alcanzado</Badge>;
      case "suspicious":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Sospechoso</Badge>;
      case "invalid_format":
        return <Badge variant="outline">Formato Inválido</Badge>;
      default:
        return <Badge variant="outline">{attemptType}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exitosos</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limitados</p>
                <p className="text-2xl font-bold text-orange-600">{stats.rateLimitedAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sospechosos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.suspiciousAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Historial de Intentos de Canje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay intentos de canje registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 gap-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-mono text-sm bg-background px-2 py-1 rounded">{attempt.code_value}</div>
                    {getAttemptBadge(attempt.attempt_type)}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(attempt.created_at)}</div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Medidas de Seguridad Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Límite de Intentos</p>
                <p className="text-sm text-muted-foreground">
                  Máximo 10 intentos de canje por hora para prevenir abuso
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Validación de Formato</p>
                <p className="text-sm text-muted-foreground">
                  Los códigos deben tener el formato correcto (letras, números y guiones)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Registro de Auditoría</p>
                <p className="text-sm text-muted-foreground">
                  Todos los intentos de canje son registrados para monitoreo de seguridad
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Detección de Actividad Sospechosa</p>
                <p className="text-sm text-muted-foreground">
                  El sistema detecta automáticamente patrones de uso anómalos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

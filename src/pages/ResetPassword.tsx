import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for Supabase to process the recovery token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check current session in case it was already set
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", description: "Intenta nuevamente.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Contraseña actualizada", description: "Inicia sesión con tu nueva contraseña." });
      await supabase.auth.signOut();
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la contraseña.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa tu nueva contraseña para continuar.</p>
        </header>

        {!ready && (
          <div className="text-sm text-muted-foreground">Validando enlace de recuperación...</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-disabled={!ready}>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              disabled={!ready || submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={!ready || submitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!ready || submitting}>
            {submitting ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </section>
    </main>
  );
}

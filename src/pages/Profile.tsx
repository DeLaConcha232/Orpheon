import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { PointsBadge } from '@/components/loyalty/PointsBadge';
import { CustomButton } from '@/components/ui/custom-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit, LogOut, Mail, Phone, Calendar, Award, Settings, Shield, QrCode, Hash, ChevronDown, Copy, Languages, Globe, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import QRCode from 'qrcode';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  points: number;
  created_at: string;
  hex_code: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const { toast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Conditional rendering AFTER all hooks
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchProfile = async () => {
    setLoadingProfile(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || ''
      });
      
      // Generate QR code
      if (data.hex_code) {
        generateQRCode(data.hex_code);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const generateQRCode = async (hexCode: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(hexCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han guardado correctamente",
        variant: "default",
      });

      setEditing(false);
      await fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading || loadingProfile) {
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-secondary" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-1">{profile?.full_name || t('profile.title')}</h1>
          <p className="text-muted-foreground mb-3">{profile?.email}</p>
          <PointsBadge points={profile?.points || 0} size="lg" />
        </motion.div>
        {/* Profile Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card p-1">
            <TabsTrigger value="profile" className="rounded-2xl data-[state=active]:bg-secondary/20">
              <User className="w-4 h-4 mr-2" />
              {t('nav.profile')}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-2xl data-[state=active]:bg-accent/20">
              <Shield className="w-4 h-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* User Codes Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-accent" />
                    Mi Código de Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      {qrCodeUrl && (
                        <img 
                          src={qrCodeUrl} 
                          alt="Código QR del usuario" 
                          className="w-48 h-48"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Este código QR contiene tu identificador único. Preséntalo para verificar tu identidad.
                    </p>
                  </div>

                  <Separator />

                  {/* Hex Code */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Código Hexadecimal</Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                      <code className="flex-1 text-sm font-mono text-foreground bg-transparent">
                        {profile?.hex_code || 'Cargando...'}
                      </code>
                      <CustomButton
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(profile?.hex_code || '', 'Código hexadecimal')}
                      >
                        <Copy className="w-4 h-4" />
                      </CustomButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Theme Selection */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-secondary" />
                    Tema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Modo Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          Modo Oscuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.section>

            {/* Language Selection */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="floating-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-accent" />
                    {t('profile.language')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(value: 'es' | 'en') => setLanguage(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {t('profile.spanish')}
                        </div>
                      </SelectItem>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {t('profile.english')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.section>

            {/* Personal Information - Collapsible */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="floating-card">
                <Collapsible open={personalInfoOpen} onOpenChange={setPersonalInfoOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <Settings className="w-5 h-5 text-secondary" />
                          {t('profile.personalInfo')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {!personalInfoOpen && (
                            <CustomButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(!editing);
                                setPersonalInfoOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </CustomButton>
                          )}
                          <ChevronDown className={`w-4 h-4 transition-transform ${personalInfoOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {personalInfoOpen && (
                        <div className="flex justify-end mb-4">
                          <CustomButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(!editing)}
                          >
                            <Edit className="w-4 h-4" />
                            {editing ? 'Cancelar' : 'Editar'}
                          </CustomButton>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{profile?.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre completo</Label>
                        {editing ? (
                          <Input
                            id="fullName"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Tu nombre completo"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {profile?.full_name || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        {editing ? (
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Tu número de teléfono"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {profile?.phone || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>

                      {editing && (
                        <CustomButton
                          variant="premium"
                          className="w-full mt-6"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </CustomButton>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.section>

            {/* Account Stats */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="loyalty-card border-0 premium-bg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Award className="w-5 h-5 text-accent" />
                    Estadísticas de Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Puntos totales</span>
                    <PointsBadge points={profile?.points || 0} size="sm" animated={false} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Miembro desde</span>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Calendar className="w-3 h-3" />
                      {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Sign Out */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <CustomButton
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </CustomButton>
            </motion.section>
          </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SecurityMonitor />
          </motion.div>
        </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Shield, Database, LogOut, Trash2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
        setName(data.name);
      } else {
        // Criar perfil se não existir
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              user_id: user.id,
              name:
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Usuário",
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setName(newProfile.name);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso.",
      });

      loadProfile(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar senha.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao realizar logout.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    // Esta funcionalidade requer implementação adicional no backend
    toast({
      title: "Funcionalidade não disponível",
      description: "Entre em contato com o suporte para exclusão de conta.",
      variant: "destructive",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Configurações
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie sua conta e preferências do aplicativo
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Informações da Conta */}
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription className="text-sm">
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  placeholder="Seu email"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </div>

            {profile && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Criado em: {formatDate(profile.created_at)}</span>
                <span>
                  Última atualização: {formatDate(profile.updated_at)}
                </span>
              </div>
            )}

            <Button
              onClick={saveProfile}
              disabled={saving}
              style={{ background: "var(--income-gradient)" }}
              className="w-full sm:w-auto"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Segurança
            </CardTitle>
            <CardDescription className="text-sm">
              Altere sua senha e configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  Nova senha
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mínimo 6 caracteres)"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirmar senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                />
              </div>
            </div>

            <Button
              onClick={changePassword}
              disabled={saving || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {saving ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>

        {/* Dados e Privacidade */}
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
              Dados e Privacidade
            </CardTitle>
            <CardDescription className="text-sm">
              Gerencie seus dados e configurações de privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-destructive">
                  Zona de Perigo
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ações irreversíveis que afetam permanentemente sua conta.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="border-muted-foreground w-full sm:w-auto"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Sair da Conta
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Excluir conta permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá
                          permanentemente sua conta e removerá todos os seus
                          dados de nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                          Sim, excluir conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

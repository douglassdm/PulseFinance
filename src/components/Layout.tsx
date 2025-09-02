import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Moon, Sun, User, Settings, LogOut, Calendar, Target, TrendingUp, CreditCard, AlertTriangle } from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  type: 'recurring' | 'goal' | 'debt' | 'investment' | 'general';
  title: string;
  message: string;
  icon: React.ComponentType<any>;
  priority: 'low' | 'medium' | 'high';
  date: Date;
  actionUrl?: string;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      loadNotifications();
      
      // Refresh notifications every 5 minutes
      const interval = setInterval(() => {
        loadNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, loading, navigate]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    try {
      const notifications: Notification[] = [];
      const today = new Date();
      
      // Check recurring transactions due soon
      const { data: recurringTransactions } = await supabase
        .from('recurring_transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .is('end_date', null); // Only active transactions
      
      if (recurringTransactions) {
        recurringTransactions.forEach(transaction => {
          const nextDate = new Date(transaction.next_occurrence_date);
          const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 3 && daysUntil >= 0) {
            notifications.push({
              id: `recurring-${transaction.id}`,
              type: 'recurring',
              title: 'Transação Recorrente Próxima',
              message: `${transaction.description} vence em ${daysUntil} dia(s) - ${formatCurrency(transaction.value)}`,
              icon: Calendar,
              priority: daysUntil <= 1 ? 'high' : 'medium',
              date: nextDate,
              actionUrl: '/recurring'
            });
          }
        });
      }

      // Check debts due soon
      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .not('due_date', 'is', null);
      
      if (debts) {
        debts.forEach(debt => {
          const dueDate = new Date(debt.due_date);
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7 && daysUntil >= 0) {
            notifications.push({
              id: `debt-${debt.id}`,
              type: 'debt',
              title: 'Dívida Vencendo',
              message: `${debt.name} vence em ${daysUntil} dia(s) - ${formatCurrency(debt.current_amount)}`,
              icon: AlertTriangle,
              priority: daysUntil <= 3 ? 'high' : 'medium',
              date: dueDate,
              actionUrl: '/debts'
            });
          }
        });
      }

      // Check goals close to completion
      const { data: goals } = await supabase
        .from('financial_goals')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .not('end_period', 'is', null);
      
      if (goals) {
        // For each goal, get progress from goal_progress table
        const goalsWithProgress = await Promise.all(
          goals.map(async (goal) => {
            const { data: progressData } = await supabase
              .from('goal_progress')
              .select('value')
              .eq('goal_id', goal.id);
            
            const currentAmount = progressData?.reduce((sum, p) => sum + Number(p.value), 0) || 0;
            return { ...goal, current_amount: currentAmount };
          })
        );

        goalsWithProgress.forEach(goal => {
          const progress = (goal.current_amount / goal.target_value) * 100;
          const targetDate = new Date(goal.end_period);
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (progress >= 80 && progress < 100) {
            notifications.push({
              id: `goal-progress-${goal.id}`,
              type: 'goal',
              title: 'Meta Quase Atingida!',
              message: `Meta de ${goal.type} está em ${progress.toFixed(0)}% - Faltam apenas ${formatCurrency(goal.target_value - goal.current_amount)}`,
              icon: Target,
              priority: 'medium',
              date: new Date(),
              actionUrl: '/goals'
            });
          }

          if (daysUntil <= 30 && daysUntil > 0 && progress < 50) {
            notifications.push({
              id: `goal-deadline-${goal.id}`,
              type: 'goal',
              title: 'Meta com Prazo Próximo',
              message: `Meta de ${goal.type} vence em ${daysUntil} dia(s) e está em ${progress.toFixed(0)}%`,
              icon: Target,
              priority: 'medium',
              date: targetDate,
              actionUrl: '/goals'
            });
          }
        });
      }

      // Check investment suggestions
      const { data: lastInvestment } = await supabase
        .from('investments')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!lastInvestment || lastInvestment.length === 0) {
        notifications.push({
          id: 'investment-suggestion-1',
          type: 'investment',
          title: 'Comece a Investir!',
          message: 'Que tal registrar seu primeiro investimento e começar a construir seu patrimônio?',
          icon: TrendingUp,
          priority: 'low',
          date: new Date(),
          actionUrl: '/investments'
        });
      } else {
        const lastInvestmentDate = new Date(lastInvestment[0].created_at);
        const daysSinceLastInvestment = Math.floor((today.getTime() - lastInvestmentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastInvestment >= 30) {
          notifications.push({
            id: 'investment-suggestion-2',
            type: 'investment',
            title: 'Tempo de Investir Novamente',
            message: `Já faz ${daysSinceLastInvestment} dias desde seu último investimento. Que tal diversificar?`,
            icon: TrendingUp,
            priority: 'low',
            date: new Date(),
            actionUrl: '/investments'
          });
        }
      }

      // Sort by priority and date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      notifications.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.date.getTime() - b.date.getTime();
      });

      setNotifications(notifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
    
    toast({
      title: "Tema alterado",
      description: `Modo ${newTheme === "dark" ? "escuro" : "claro"} ativado.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleNotificationClick = (notification?: Notification) => {
    if (notification?.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao sair da conta.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Você foi desconectado com sucesso.",
      });
    }
  };

  const handleProfileClick = () => {
    navigate("/settings");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg-gradient)" }}
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div
        className="min-h-screen flex w-full"
        style={{ background: "var(--bg-gradient)" }}
      >
        <AppSidebar />

        <SidebarInset>
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4">
            <SidebarTrigger />
            
            <div className="flex items-center gap-2">
              {/* Notification Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {notifications.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">Notificações</h3>
                    <p className="text-sm text-muted-foreground">
                      {notifications.length === 0 
                        ? 'Nenhuma notificação' 
                        : `${notifications.length} ${notifications.length === 1 ? 'notificação' : 'notificações'}`
                      }
                    </p>
                  </div>
                  
                  {notificationsLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma notificação no momento
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="p-2">
                        {notifications.map((notification) => {
                          const IconComponent = notification.icon;
                          return (
                            <div
                              key={notification.id}
                              className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${
                                  notification.priority === 'high' ? 'bg-destructive/10' :
                                  notification.priority === 'medium' ? 'bg-warning/10' :
                                  'bg-muted'
                                }`}>
                                  <IconComponent className={`h-4 w-4 ${getPriorityColor(notification.priority)}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm truncate">
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {getTimeAgo(notification.date)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={loadNotifications}
                      >
                        Atualizar notificações
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email || "Usuário"}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

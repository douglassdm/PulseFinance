import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Debt {
  id: string;
  name: string;
  original_amount: number;
  current_amount: number;
  interest_rate: number | null;
  due_date: string | null;
  creditor: string | null;
  description: string | null;
  created_at: string;
}

const Debts = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDebts();
    }
  }, [user]);

  const loadDebts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDebtProgress = (original: number, current: number) => {
    const paid = original - current;
    const percentage = (paid / original) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const totalOriginal = debts.reduce((sum, debt) => sum + debt.original_amount, 0);
  const totalCurrent = debts.reduce((sum, debt) => sum + debt.current_amount, 0);
  const totalPaid = totalOriginal - totalCurrent;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dívidas</h2>
          <p className="text-muted-foreground">
            Gerencie suas dívidas e acompanhe o progresso dos pagamentos
          </p>
        </div>
        <Button style={{ background: 'var(--expense-gradient)' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Dívida
        </Button>
      </div>

      {/* Resumo das Dívidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card style={{ background: 'var(--expense-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total em Dívidas</CardTitle>
            <CreditCard className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalCurrent)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Original</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOriginal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Dívidas */}
      {debts.length === 0 ? (
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma dívida cadastrada</h3>
            <p className="text-muted-foreground text-center mb-6">
              Mantenha o controle das suas dívidas registrando-as aqui
            </p>
            <Button style={{ background: 'var(--expense-gradient)' }}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {debts.map((debt) => {
            const progress = getDebtProgress(debt.original_amount, debt.current_amount);
            const daysUntilDue = getDaysUntilDue(debt.due_date);
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
            const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;

            return (
              <Card key={debt.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    <CardDescription>
                      {debt.creditor && (
                        <span className="text-xs">Credor: {debt.creditor}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Original</p>
                        <p className="font-semibold">{formatCurrency(debt.original_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold text-expense">{formatCurrency(debt.current_amount)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progresso do Pagamento</span>
                        <span className="text-sm font-semibold text-success">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs mt-1 text-success">
                        Pago: {formatCurrency(debt.original_amount - debt.current_amount)}
                      </p>
                    </div>

                    {debt.due_date && (
                      <div className="flex items-center gap-2">
                        <AlertCircle 
                          className={`h-4 w-4 ${
                            isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : 'text-muted-foreground'
                          }`} 
                        />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Vencimento: </span>
                            <span className={isOverdue ? 'text-destructive font-semibold' : ''}>
                              {formatDate(debt.due_date)}
                            </span>
                          </p>
                          {daysUntilDue !== null && (
                            <p className={`text-xs ${
                              isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : 'text-muted-foreground'
                            }`}>
                              {isOverdue 
                                ? `Vencida há ${Math.abs(daysUntilDue)} dia(s)`
                                : isDueSoon
                                ? `Vence em ${daysUntilDue} dia(s)`
                                : `${daysUntilDue} dias restantes`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {debt.interest_rate && (
                      <div className="text-xs text-muted-foreground">
                        Taxa de juros: {debt.interest_rate}% ao ano
                      </div>
                    )}

                    {debt.description && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        {debt.description}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Debts;
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Calendar, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface RecurringTransaction {
  id: string;
  type: 'receita' | 'despesa';
  value: number;
  description: string;
  start_date: string;
  end_date: string | null;
  frequency: string;
  next_occurrence_date: string;
  categories: { name: string } | null;
  bank_accounts: { name: string };
  created_at: string;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual'
};

const RecurringTransactions = () => {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecurringTransactions();
    }
  }, [user]);

  const loadRecurringTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          id, type, value, description, start_date, end_date, frequency, next_occurrence_date, created_at,
          categories(name),
          bank_accounts(name)
        `)
        .eq('user_id', user.id)
        .order('next_occurrence_date', { ascending: true });

      if (error) throw error;
      setRecurringTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações recorrentes:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilNext = (nextDate: string) => {
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isActive = (transaction: RecurringTransaction) => {
    const today = new Date().toISOString().split('T')[0];
    const hasEndDate = transaction.end_date;
    return !hasEndDate || transaction.end_date >= today;
  };

  const activeTransactions = recurringTransactions.filter(isActive);
  const inactiveTransactions = recurringTransactions.filter(t => !isActive(t));

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
          <h2 className="text-3xl font-bold tracking-tight">Transações Recorrentes</h2>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas automáticas
          </p>
        </div>
        <Button style={{ background: 'var(--income-gradient)' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Recorrência
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringTransactions.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--income-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Ativas</CardTitle>
            <Play className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeTransactions.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <RefreshCw className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {recurringTransactions.filter(t => t.type === 'receita').length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <RefreshCw className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {recurringTransactions.filter(t => t.type === 'despesa').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Ativas */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-success" />
            Transações Ativas ({activeTransactions.length})
          </CardTitle>
          <CardDescription>
            Transações que ainda estão sendo executadas automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTransactions.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma transação ativa</h3>
              <p className="text-muted-foreground mb-6">
                Crie transações recorrentes para automatizar suas finanças
              </p>
              <Button style={{ background: 'var(--income-gradient)' }}>
                <Plus className="h-4 w-4 mr-2" />
                Primeira Recorrência
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTransactions.map((transaction) => {
                  const daysUntilNext = getDaysUntilNext(transaction.next_occurrence_date);
                  const isUpcoming = daysUntilNext <= 3 && daysUntilNext >= 0;
                  const isOverdue = daysUntilNext < 0;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.description || 'Sem descrição'}
                      </TableCell>
                      <TableCell>
                        {transaction.categories?.name || 'Sem categoria'}
                      </TableCell>
                      <TableCell>{transaction.bank_accounts.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {frequencyLabels[transaction.frequency] || transaction.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className={isOverdue ? 'text-destructive font-semibold' : isUpcoming ? 'text-warning font-semibold' : ''}>
                            {formatDate(transaction.next_occurrence_date)}
                          </p>
                          <p className={`text-xs ${isOverdue ? 'text-destructive' : isUpcoming ? 'text-warning' : 'text-muted-foreground'}`}>
                            {isOverdue 
                              ? `Atrasada ${Math.abs(daysUntilNext)} dia(s)`
                              : daysUntilNext === 0
                              ? 'Hoje!'
                              : `Em ${daysUntilNext} dia(s)`
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'receita' ? 'default' : 'destructive'}
                          className={transaction.type === 'receita' ? 'bg-success text-white' : 'bg-expense text-white'}
                        >
                          {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.type === 'receita' ? 'text-success' : 'text-expense'}>
                          {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(transaction.value))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" title="Executar agora">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Pause className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transações Inativas */}
      {inactiveTransactions.length > 0 && (
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-muted-foreground" />
              Transações Inativas ({inactiveTransactions.length})
            </CardTitle>
            <CardDescription>
              Transações que chegaram ao fim do período ou foram pausadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="opacity-60">
                    <TableCell className="font-medium">
                      {transaction.description || 'Sem descrição'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{formatDate(transaction.start_date)} até</p>
                        <p>{transaction.end_date ? formatDate(transaction.end_date) : 'Indefinido'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(transaction.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" title="Reativar">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecurringTransactions;
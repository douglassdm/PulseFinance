import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  PiggyBank,
  CreditCard,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalInvestments: number;
  totalDebts: number;
  totalGoals: number;
  accountsCount: number;
  recentTransactions: any[];
}

interface Category {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
}

interface BankAccount {
  id: string;
  name: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    type: 'receita' as 'receita' | 'despesa',
    value: '',
    description: '',
    category_id: '',
    bank_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadCategories();
      loadBankAccounts();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar transações do mês atual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const [
        transactionsResult,
        accountsResult,
        investmentsResult,
        debtsResult,
        goalsResult,
        recentTransactionsResult
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('value, type')
          .eq('user_id', user.id)
          .gte('transaction_date', startOfMonth)
          .lte('transaction_date', endOfMonth),
        
        supabase
          .from('bank_accounts')
          .select('id, name, initial_balance')
          .eq('user_id', user.id),
        
        supabase
          .from('investments')
          .select('current_amount')
          .eq('user_id', user.id),
        
        supabase
          .from('debts')
          .select('current_amount')
          .eq('user_id', user.id),
        
        supabase
          .from('financial_goals')
          .select('target_value')
          .eq('user_id', user.id),
        
        supabase
          .from('transactions')
          .select(`
            id, value, type, description, transaction_date,
            categories(name),
            bank_accounts(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const transactions = transactionsResult.data || [];
      const totalIncome = transactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + Number(t.value), 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Number(t.value), 0);

      const balance = totalIncome - totalExpense;
      
      const totalInvestments = (investmentsResult.data || [])
        .reduce((sum, inv) => sum + Number(inv.current_amount), 0);
      
      const totalDebts = (debtsResult.data || [])
        .reduce((sum, debt) => sum + Number(debt.current_amount), 0);
      
      const totalGoals = (goalsResult.data || [])
        .reduce((sum, goal) => sum + Number(goal.target_value), 0);

      setStats({
        totalIncome,
        totalExpense,
        balance,
        totalInvestments,
        totalDebts,
        totalGoals,
        accountsCount: accountsResult.data?.length || 0,
        recentTransactions: recentTransactionsResult.data || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadBankAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'receita',
      value: '',
      description: '',
      category_id: '',
      bank_account_id: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleCreateTransaction = async () => {
    if (!user || !formData.value.trim() || !formData.bank_account_id || !formData.transaction_date) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: formData.type,
          value: parseFloat(formData.value),
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          bank_account_id: formData.bank_account_id,
          transaction_date: formData.transaction_date
        }]);

      if (error) throw error;

      setTransactionModalOpen(false);
      resetForm();
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  const openTransactionModal = () => {
    resetForm();
    setTransactionModalOpen(true);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
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
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral das suas finanças
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openTransactionModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balanceVisible ? formatCurrency(stats?.balance || 0) : '••••••'}
            </div>
            <p className={`text-xs ${(stats?.balance || 0) >= 0 ? 'text-success' : 'text-expense'}`}>
              {(stats?.balance || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1" />
              )}
              {(stats?.balance || 0) >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--income-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
            <p className="text-xs text-white/80">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--expense-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(stats?.totalExpense || 0)}
            </div>
            <p className="text-xs text-white/80">
              -4.3% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--investment-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Investimentos</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(stats?.totalInvestments || 0)}
            </div>
            <p className="text-xs text-white/80">
              +12.5% este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dívidas Totais</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(stats?.totalDebts || 0)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-goal">
              {formatCurrency(stats?.totalGoals || 0)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.accountsCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas 5 transações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma transação encontrada
              </p>
            ) : (
              stats?.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.categories?.name || 'Sem categoria'} • {transaction.bank_accounts?.name} • {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.type === 'receita' ? 'default' : 'destructive'}>
                      {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.value)))}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Nova Transação */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Registre uma nova transação financeira
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'receita' | 'despesa') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor *
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Descrição da transação"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.type === formData.type).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bank_account" className="text-right">
                Conta Bancária *
              </Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_date" className="text-right">
                Data *
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTransaction} 
              disabled={!formData.value.trim() || !formData.bank_account_id || !formData.transaction_date}
            >
              Criar Transação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
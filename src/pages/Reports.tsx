import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, TrendingUp, TrendingDown, PieChart, BarChart3, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryData {
  name: string;
  total: number;
  percentage: number;
  type: 'receita' | 'despesa';
}

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0
  });

  useEffect(() => {
    if (user) {
      loadReportsData();
    }
  }, [user, selectedPeriod]);

  const loadReportsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calcular período baseado na seleção
      const today = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case '1month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case '3months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
          break;
        case '6months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
          break;
        case '1year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];

      // Buscar transações do período
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          value, type, transaction_date,
          categories(name)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', startDateStr)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Calcular dados mensais
      const monthlyMap = new Map<string, { income: number; expense: number }>();
      const categoryMap = new Map<string, { total: number; type: 'receita' | 'despesa' }>();
      
      let totalIncome = 0;
      let totalExpense = 0;

      transactions?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = Number(transaction.value);

        // Dados mensais
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { income: 0, expense: 0 });
        }
        const monthData = monthlyMap.get(monthKey)!;
        
        if (transaction.type === 'receita') {
          monthData.income += value;
          totalIncome += value;
        } else {
          monthData.expense += value;
          totalExpense += value;
        }

        // Dados por categoria
        const categoryName = transaction.categories?.name || 'Sem categoria';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { total: 0, type: transaction.type });
        }
        categoryMap.get(categoryName)!.total += value;
      });

      // Converter dados mensais
      const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }));

      // Converter dados de categoria e calcular percentagens
      const total = totalIncome + totalExpense;
      const categoryArray: CategoryData[] = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        total: data.total,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
        type: data.type
      })).sort((a, b) => b.total - a.total);

      setMonthlyData(monthlyArray);
      setCategoryData(categoryArray.slice(0, 10)); // Top 10 categorias
      setTotalStats({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions?.length || 0
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '1month': return 'Último mês';
      case '3months': return 'Últimos 3 meses';
      case '6months': return 'Últimos 6 meses';
      case '1year': return 'Último ano';
      default: return 'Últimos 6 meses';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
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
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Análise detalhada das suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card style={{ background: 'var(--income-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalStats.totalIncome)}
            </div>
            <p className="text-xs text-white/80">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--expense-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalStats.totalExpense)}
            </div>
            <p className="text-xs text-white/80">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <BarChart3 className={`h-4 w-4 ${totalStats.balance >= 0 ? 'text-success' : 'text-expense'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalStats.balance >= 0 ? 'text-success' : 'text-expense'}`}>
              {formatCurrency(totalStats.balance)}
            </div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle>Análises Detalhadas</CardTitle>
          <CardDescription>
            Visualizações e insights sobre seus dados financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Evolução Mensal</h3>
                {monthlyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthlyData.map((month) => (
                      <Card key={month.month} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{formatMonth(month.month)}</h4>
                          <Badge variant={month.balance >= 0 ? 'default' : 'destructive'}>
                            {month.balance >= 0 ? 'Positivo' : 'Negativo'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Receitas</p>
                            <p className="font-semibold text-success">{formatCurrency(month.income)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Despesas</p>
                            <p className="font-semibold text-expense">{formatCurrency(month.expense)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Saldo</p>
                            <p className={`font-semibold ${month.balance >= 0 ? 'text-success' : 'text-expense'}`}>
                              {formatCurrency(month.balance)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
                {categoryData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria encontrada para o período selecionado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryData.map((category) => (
                      <Card key={category.name} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{category.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={category.type === 'receita' ? 'default' : 'destructive'}
                              className={category.type === 'receita' ? 'bg-success text-white' : 'bg-expense text-white'}
                            >
                              {category.type === 'receita' ? 'Receita' : 'Despesa'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {category.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${category.type === 'receita' ? 'bg-success' : 'bg-expense'}`}
                              style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(category.total)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tendências e Insights</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Maior Receita Mensal</h4>
                    {monthlyData.length > 0 ? (
                      <div>
                        <p className="text-2xl font-bold text-success">
                          {formatCurrency(Math.max(...monthlyData.map(m => m.income)))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatMonth(monthlyData.find(m => m.income === Math.max(...monthlyData.map(d => d.income)))?.month || '')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados</p>
                    )}
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Maior Despesa Mensal</h4>
                    {monthlyData.length > 0 ? (
                      <div>
                        <p className="text-2xl font-bold text-expense">
                          {formatCurrency(Math.max(...monthlyData.map(m => m.expense)))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatMonth(monthlyData.find(m => m.expense === Math.max(...monthlyData.map(d => d.expense)))?.month || '')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados</p>
                    )}
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Média Mensal</h4>
                    {monthlyData.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Receitas:</span>
                          <span className="text-success font-semibold">
                            {formatCurrency(monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Despesas:</span>
                          <span className="text-expense font-semibold">
                            {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthlyData.length)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados</p>
                    )}
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Categoria Mais Utilizada</h4>
                    {categoryData.length > 0 ? (
                      <div>
                        <p className="font-semibold">{categoryData[0].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(categoryData[0].total)} • {categoryData[0].percentage.toFixed(1)}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados</p>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
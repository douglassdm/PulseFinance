import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, TrendingUp, TrendingDown, PieChart, BarChart3, Download, Activity, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

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

  // Paleta de cores para os gráficos
  const incomeColors = [
    '#10b981', // emerald-500
    '#059669', // emerald-600
    '#047857', // emerald-700
    '#065f46', // emerald-800
    '#064e3b', // emerald-900
    '#34d399', // emerald-400
    '#6ee7b7', // emerald-300
    '#a7f3d0', // emerald-200
    '#22c55e', // green-500
    '#16a34a'  // green-600
  ];

  const expenseColors = [
    '#ef4444', // red-500
    '#dc2626', // red-600
    '#b91c1c', // red-700
    '#991b1b', // red-800
    '#7f1d1d', // red-900
    '#f87171', // red-400
    '#fca5a5', // red-300
    '#fecaca', // red-200
    '#f97316', // orange-500
    '#ea580c'  // orange-600
  ];

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
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Análise detalhada das suas finanças
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0">
              <TabsTrigger value="monthly" className="text-xs sm:text-sm">Evolução Mensal</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm">Por Categoria</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">Tendências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <h3 className="text-lg font-semibold">Evolução Mensal</h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">Receitas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">Despesas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">Saldo</span>
                    </div>
                  </div>
                </div>

                {monthlyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado
                  </div>
                ) : (
                  <>
                    {/* Gráfico de Linhas */}
                    <Card className="p-4 sm:p-6">
                      <h4 className="text-sm sm:text-md font-medium mb-4">Gráfico de Evolução</h4>
                      <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="month" 
                              tickFormatter={formatMonth}
                              className="text-xs"
                            />
                            <YAxis 
                              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                              className="text-xs"
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                const label = name === 'income' ? 'Receitas' : name === 'expense' ? 'Despesas' : 'Saldo';
                                return [formatCurrency(value as number), label];
                              }}
                              labelFormatter={(value) => formatMonth(value as string)}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                color: 'hsl(var(--foreground))'
                              }}
                              labelStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                              itemStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="income" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="expense" 
                              stroke="#ef4444" 
                              strokeWidth={3}
                              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="balance" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Gráfico de Barras */}
                    <Card className="p-4 sm:p-6">
                      <h4 className="text-sm sm:text-md font-medium mb-4">Comparativo Mensal</h4>
                      <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="month" 
                              tickFormatter={formatMonth}
                              className="text-xs"
                            />
                            <YAxis 
                              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                              className="text-xs"
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                const label = name === 'income' ? 'Receitas' : 'Despesas';
                                return [formatCurrency(value as number), label];
                              }}
                              labelFormatter={(value) => formatMonth(value as string)}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                color: 'hsl(var(--foreground))'
                              }}
                              labelStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                              itemStyle={{
                                color: 'hsl(var(--foreground))'
                              }}
                            />
                            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Tabela Detalhada */}
                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-md font-medium">Detalhes por Mês</h4>
                      {monthlyData.map((month) => (
                        <Card key={month.month} className="p-3 sm:p-4">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-3">
                            <h4 className="font-medium text-sm sm:text-base">{formatMonth(month.month)}</h4>
                            <Badge variant={month.balance >= 0 ? 'default' : 'destructive'} className="w-fit">
                              {month.balance >= 0 ? 'Positivo' : 'Negativo'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div className="text-center sm:text-left">
                              <p className="text-muted-foreground">Receitas</p>
                              <p className="font-semibold text-success text-sm sm:text-base">{formatCurrency(month.income)}</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-muted-foreground">Despesas</p>
                              <p className="font-semibold text-expense text-sm sm:text-base">{formatCurrency(month.expense)}</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <p className="text-muted-foreground">Saldo</p>
                              <p className={`font-semibold text-sm sm:text-base ${month.balance >= 0 ? 'text-success' : 'text-expense'}`}>
                                {formatCurrency(month.balance)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
                {categoryData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria encontrada para o período selecionado
                  </div>
                ) : (
                  <>
                    {/* Gráfico de Pizza para Categorias */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                      {/* Receitas */}
                      <Card className="p-4 sm:p-6">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                          <h4 className="text-sm sm:text-md font-medium">Distribuição por Receitas</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {categoryData.filter(cat => cat.type === 'receita').length} categorias
                            </span>
                          </div>
                        </div>
                        <div className="h-64 sm:h-80">
                          {categoryData.filter(cat => cat.type === 'receita').length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={categoryData.filter(cat => cat.type === 'receita')}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  innerRadius={40}
                                  paddingAngle={3}
                                  dataKey="total"
                                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                                  labelLine={false}
                                >
                                  {categoryData.filter(cat => cat.type === 'receita').map((entry, index) => (
                                    <Cell 
                                      key={`income-cell-${index}`} 
                                      fill={incomeColors[index % incomeColors.length]}
                                      stroke="hsl(var(--background))"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name, props) => [
                                    formatCurrency(value as number),
                                    `${props.payload.name} (${props.payload.percentage.toFixed(1)}%)`
                                  ]}
                                  labelFormatter={() => 'Receita'}
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  labelStyle={{
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  itemStyle={{
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={60}
                                  wrapperStyle={{
                                    paddingTop: '20px',
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  formatter={(value, entry) => {
                                    const payload = entry.payload as CategoryData;
                                    return (
                                      <span style={{ color: entry.color }}>
                                        {payload.name}: {formatCurrency(payload.total)}
                                      </span>
                                    );
                                  }}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma receita por categoria encontrada</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Despesas */}
                      <Card className="p-4 sm:p-6">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                          <h4 className="text-sm sm:text-md font-medium">Distribuição por Despesas</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {categoryData.filter(cat => cat.type === 'despesa').length} categorias
                            </span>
                          </div>
                        </div>
                        <div className="h-64 sm:h-80">
                          {categoryData.filter(cat => cat.type === 'despesa').length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={categoryData.filter(cat => cat.type === 'despesa')}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  innerRadius={40}
                                  paddingAngle={3}
                                  dataKey="total"
                                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                                  labelLine={false}
                                >
                                  {categoryData.filter(cat => cat.type === 'despesa').map((entry, index) => (
                                    <Cell 
                                      key={`expense-cell-${index}`} 
                                      fill={expenseColors[index % expenseColors.length]}
                                      stroke="hsl(var(--background))"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value, name, props) => [
                                    formatCurrency(value as number),
                                    `${props.payload.name} (${props.payload.percentage.toFixed(1)}%)`
                                  ]}
                                  labelFormatter={() => 'Despesa'}
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  labelStyle={{
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  itemStyle={{
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={60}
                                  wrapperStyle={{
                                    paddingTop: '20px',
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  formatter={(value, entry) => {
                                    const payload = entry.payload as CategoryData;
                                    return (
                                      <span style={{ color: entry.color }}>
                                        {payload.name}: {formatCurrency(payload.total)}
                                      </span>
                                    );
                                  }}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma despesa por categoria encontrada</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Lista Detalhada */}
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <h4 className="text-sm sm:text-md font-medium">Detalhes por Categoria</h4>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {categoryData.length} categorias encontradas
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {categoryData.map((category, index) => {
                          const colorIndex = categoryData.filter(c => c.type === category.type).findIndex(c => c.name === category.name);
                          const bgColor = category.type === 'receita' ? 
                            incomeColors[colorIndex % incomeColors.length] : 
                            expenseColors[colorIndex % expenseColors.length];
                          
                          return (
                            <Card key={category.name} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-3">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: bgColor }}
                                  ></div>
                                  <h5 className="font-medium text-sm sm:text-base truncate">{category.name}</h5>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge 
                                    variant={category.type === 'receita' ? 'default' : 'destructive'}
                                    className={`text-xs ${category.type === 'receita' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} dark:${category.type === 'receita' ? 'bg-green-900 text-green-200 border-green-800' : 'bg-red-900 text-red-200 border-red-800'}`}
                                  >
                                    {category.type === 'receita' ? 'Receita' : 'Despesa'}
                                  </Badge>
                                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    {category.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex-1 bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                                  <div 
                                    className="h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ 
                                      width: `${Math.min(category.percentage, 100)}%`,
                                      backgroundColor: bgColor
                                    }}
                                  />
                                </div>
                                <span className="font-bold text-sm sm:text-lg min-w-fit flex-shrink-0">
                                  {formatCurrency(category.total)}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Tendências e Insights</h3>
                
                {/* Indicadores Principais */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-4" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">Maior Receita</h4>
                        {monthlyData.length > 0 ? (
                          <div>
                            <p className="text-xl font-bold text-white">
                              {formatCurrency(Math.max(...monthlyData.map(m => m.income)))}
                            </p>
                            <p className="text-xs text-white/80">
                              {formatMonth(monthlyData.find(m => m.income === Math.max(...monthlyData.map(d => d.income)))?.month || '')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-white/80">Sem dados</p>
                        )}
                      </div>
                      <TrendingUp className="h-8 w-8 text-white/80" />
                    </div>
                  </Card>
                  
                  <Card className="p-4" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">Maior Despesa</h4>
                        {monthlyData.length > 0 ? (
                          <div>
                            <p className="text-xl font-bold text-white">
                              {formatCurrency(Math.max(...monthlyData.map(m => m.expense)))}
                            </p>
                            <p className="text-xs text-white/80">
                              {formatMonth(monthlyData.find(m => m.expense === Math.max(...monthlyData.map(d => d.expense)))?.month || '')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-white/80">Sem dados</p>
                        )}
                      </div>
                      <TrendingDown className="h-8 w-8 text-white/80" />
                    </div>
                  </Card>
                  
                  <Card className="p-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">Média Receitas</h4>
                        {monthlyData.length > 0 ? (
                          <div>
                            <p className="text-xl font-bold text-white">
                              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length)}
                            </p>
                            <p className="text-xs text-white/80">Por mês</p>
                          </div>
                        ) : (
                          <p className="text-white/80">Sem dados</p>
                        )}
                      </div>
                      <Activity className="h-8 w-8 text-white/80" />
                    </div>
                  </Card>
                  
                  <Card className="p-4" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">Média Despesas</h4>
                        {monthlyData.length > 0 ? (
                          <div>
                            <p className="text-xl font-bold text-white">
                              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthlyData.length)}
                            </p>
                            <p className="text-xs text-white/80">Por mês</p>
                          </div>
                        ) : (
                          <p className="text-white/80">Sem dados</p>
                        )}
                      </div>
                      <DollarSign className="h-8 w-8 text-white/80" />
                    </div>
                  </Card>
                </div>

                {/* Análises Complementares */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                  <Card className="p-4 sm:p-6">
                    <h4 className="text-sm sm:text-md font-medium mb-4">Categoria Mais Utilizada</h4>
                    {categoryData.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${categoryData[0].type === 'receita' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{categoryData[0].name}</p>
                            <p className="text-muted-foreground">
                              {categoryData[0].type === 'receita' ? 'Receita' : 'Despesa'}
                            </p>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Valor Total:</span>
                            <span className="font-bold text-lg">{formatCurrency(categoryData[0].total)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-muted-foreground">Percentual:</span>
                            <span className="font-semibold">{categoryData[0].percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados disponíveis</p>
                    )}
                  </Card>

                  <Card className="p-4 sm:p-6">
                    <h4 className="text-sm sm:text-md font-medium mb-4">Melhor/Pior Mês</h4>
                    {monthlyData.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Melhor Mês (Saldo)</h5>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-semibold">
                              {formatMonth(monthlyData.find(m => m.balance === Math.max(...monthlyData.map(d => d.balance)))?.month || '')}
                            </p>
                            <p className="text-green-600 font-bold">
                              {formatCurrency(Math.max(...monthlyData.map(m => m.balance)))}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">Pior Mês (Saldo)</h5>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="font-semibold">
                              {formatMonth(monthlyData.find(m => m.balance === Math.min(...monthlyData.map(d => d.balance)))?.month || '')}
                            </p>
                            <p className="text-red-600 font-bold">
                              {formatCurrency(Math.min(...monthlyData.map(m => m.balance)))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sem dados disponíveis</p>
                    )}
                  </Card>
                </div>

                {/* Taxa de Crescimento */}
                {monthlyData.length > 1 && (
                  <Card className="p-4 sm:p-6">
                    <h4 className="text-sm sm:text-md font-medium mb-4">Tendência de Crescimento</h4>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h5 className="font-medium mb-2">Receitas</h5>
                        <p className="text-2xl font-bold text-green-600">
                          {(() => {
                            const first = monthlyData[0].income;
                            const last = monthlyData[monthlyData.length - 1].income;
                            const growth = first > 0 ? ((last - first) / first * 100) : 0;
                            return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                          })()} 
                        </p>
                        <p className="text-sm text-muted-foreground">vs período anterior</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <h5 className="font-medium mb-2">Despesas</h5>
                        <p className="text-2xl font-bold text-red-600">
                          {(() => {
                            const first = monthlyData[0].expense;
                            const last = monthlyData[monthlyData.length - 1].expense;
                            const growth = first > 0 ? ((last - first) / first * 100) : 0;
                            return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                          })()} 
                        </p>
                        <p className="text-sm text-muted-foreground">vs período anterior</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-2">Saldo</h5>
                        <p className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const first = monthlyData[0].balance;
                            const last = monthlyData[monthlyData.length - 1].balance;
                            if (first === 0) return 'N/A';
                            const growth = ((last - first) / Math.abs(first) * 100);
                            return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                          })()} 
                        </p>
                        <p className="text-sm text-muted-foreground">vs período anterior</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
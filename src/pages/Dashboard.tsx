import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PiggyBank,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalInvestments: number;
  totalDebts: number;
  totalGoals: number;
  accountsCount: number;
  recentTransactions: any[];
  incomeGrowth: number;
  expenseGrowth: number;
  investmentGrowth: number;
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
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
    type: "receita" as "receita" | "despesa",
    value: "",
    description: "",
    category_id: "",
    bank_account_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
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

      // Buscar transações do mês atual e anterior
      const currentDate = new Date();

      // Mês atual
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];

      // Mês anterior
      const startOfLastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
        .toISOString()
        .split("T")[0];
      const endOfLastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      )
        .toISOString()
        .split("T")[0];

      const [
        transactionsResult,
        lastMonthTransactionsResult,
        accountsResult,
        allTransactionsResult,
        investmentsResult,
        lastMonthInvestmentsResult,
        debtsResult,
        goalsResult,
        recentTransactionsResult,
      ] = await Promise.all([
        // Transações do mês atual
        supabase
          .from("transactions")
          .select("value, type")
          .eq("user_id", user.id)
          .gte("transaction_date", startOfMonth)
          .lte("transaction_date", endOfMonth),

        // Transações do mês anterior
        supabase
          .from("transactions")
          .select("value, type")
          .eq("user_id", user.id)
          .gte("transaction_date", startOfLastMonth)
          .lte("transaction_date", endOfLastMonth),

        supabase
          .from("bank_accounts")
          .select("id, name, initial_balance")
          .eq("user_id", user.id),

        // Buscar TODAS as transações (não só do mês atual) para calcular o saldo real total
        supabase
          .from("transactions")
          .select("value, type")
          .eq("user_id", user.id),

        // Investimentos atuais
        supabase
          .from("investments")
          .select("current_amount, updated_at")
          .eq("user_id", user.id),

        // Investimentos do início do mês (aproximação para calcular crescimento mensal)
        supabase
          .from("investments")
          .select("current_amount")
          .eq("user_id", user.id)
          .lt("updated_at", startOfMonth),

        supabase.from("debts").select("current_amount").eq("user_id", user.id),

        supabase
          .from("financial_goals")
          .select("target_value")
          .eq("user_id", user.id),

        supabase
          .from("transactions")
          .select(
            `
            id, value, type, description, transaction_date,
            categories(name),
            bank_accounts(name)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Calcular valores do mês atual
      const transactions = transactionsResult.data || [];
      const totalIncome = transactions
        .filter((t) => t.type === "receita")
        .reduce((sum, t) => sum + Number(t.value), 0);

      const totalExpense = transactions
        .filter((t) => t.type === "despesa")
        .reduce((sum, t) => sum + Number(t.value), 0);

      // Calcular saldo real total considerando saldos iniciais das contas + todas as transações
      const accounts = accountsResult.data || [];
      const allTransactions = allTransactionsResult.data || [];
      
      // Somar saldos iniciais de todas as contas
      const totalInitialBalance = accounts.reduce((sum, account) => sum + Number(account.initial_balance), 0);
      
      // Calcular resultado total das transações (receitas - despesas)
      const totalTransactionBalance = allTransactions.reduce((acc, transaction) => {
        return transaction.type === 'receita' 
          ? acc + Number(transaction.value) 
          : acc - Number(transaction.value);
      }, 0);
      
      // Saldo real total = saldos iniciais + resultado das transações
      const balance = totalInitialBalance + totalTransactionBalance;

      // Calcular valores do mês anterior
      const lastMonthTransactions = lastMonthTransactionsResult.data || [];
      const lastMonthIncome = lastMonthTransactions
        .filter((t) => t.type === "receita")
        .reduce((sum, t) => sum + Number(t.value), 0);

      const lastMonthExpense = lastMonthTransactions
        .filter((t) => t.type === "despesa")
        .reduce((sum, t) => sum + Number(t.value), 0);

      // Calcular porcentagens de crescimento
      const incomeGrowth =
        lastMonthIncome > 0
          ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100
          : totalIncome > 0
          ? 100
          : 0;

      const expenseGrowth =
        lastMonthExpense > 0
          ? ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100
          : totalExpense > 0
          ? 100
          : 0;

      const totalInvestments = (investmentsResult.data || []).reduce(
        (sum, inv) => sum + Number(inv.current_amount),
        0
      );

      // Calcular investimentos do início do mês para crescimento mensal
      const lastMonthInvestments = (
        lastMonthInvestmentsResult.data || []
      ).reduce((sum, inv) => sum + Number(inv.current_amount), 0);

      const investmentGrowth =
        lastMonthInvestments > 0
          ? ((totalInvestments - lastMonthInvestments) / lastMonthInvestments) *
            100
          : totalInvestments > 0
          ? 100
          : 0;

      const totalDebts = (debtsResult.data || []).reduce(
        (sum, debt) => sum + Number(debt.current_amount),
        0
      );

      const totalGoals = (goalsResult.data || []).reduce(
        (sum, goal) => sum + Number(goal.target_value),
        0
      );

      setStats({
        totalIncome,
        totalExpense,
        balance,
        totalInvestments,
        totalDebts,
        totalGoals,
        accountsCount: accountsResult.data?.length || 0,
        recentTransactions: recentTransactionsResult.data || [],
        incomeGrowth,
        expenseGrowth,
        investmentGrowth,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("user_id", user.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadBankAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas bancárias:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "receita",
      value: "",
      description: "",
      category_id: "",
      bank_account_id: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleCreateTransaction = async () => {
    if (
      !user ||
      !formData.value.trim() ||
      !formData.bank_account_id ||
      !formData.transaction_date
    )
      return;

    try {
      const { error } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: formData.type,
          value: parseFloat(formData.value),
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          bank_account_id: formData.bank_account_id,
          transaction_date: formData.transaction_date,
        },
      ]);

      if (error) throw error;

      setTransactionModalOpen(false);
      resetForm();
      loadDashboardData();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    }
  };

  const openTransactionModal = () => {
    resetForm();
    setTransactionModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Adicionar o horário para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString("pt-BR");
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visão geral das suas finanças
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openTransactionModal}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Nova Transação</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Saldo Total
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? (
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold">
              {balanceVisible ? formatCurrency(stats?.balance || 0) : "••••••"}
            </div>
            <p
              className={`text-xs flex items-center ${
                (stats?.balance || 0) >= 0 ? "text-success" : "text-expense"
              }`}
            >
              {(stats?.balance || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 inline mr-1" />
              )}
              {(stats?.balance || 0) >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--income-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Receitas
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
            <p
              className={`text-xs text-white/80 ${
                stats?.incomeGrowth && stats.incomeGrowth < 0
                  ? "text-red-200"
                  : ""
              }`}
            >
              {stats?.incomeGrowth !== undefined
                ? `${formatPercentage(stats.incomeGrowth)} vs mês anterior`
                : "Carregando..."}
            </p>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--expense-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Despesas
            </CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(stats?.totalExpense || 0)}
            </div>
            <p
              className={`text-xs text-white/80 ${
                stats?.expenseGrowth && stats.expenseGrowth > 0
                  ? "text-red-200"
                  : ""
              }`}
            >
              {stats?.expenseGrowth !== undefined
                ? `${formatPercentage(stats.expenseGrowth)} vs mês anterior`
                : "Carregando..."}
            </p>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--investment-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Investimentos
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(stats?.totalInvestments || 0)}
            </div>
            <p
              className={`text-xs text-white/80 ${
                stats?.investmentGrowth && stats.investmentGrowth < 0
                  ? "text-red-200"
                  : ""
              }`}
            >
              {stats?.investmentGrowth !== undefined
                ? `${formatPercentage(stats.investmentGrowth)} este mês`
                : "Carregando..."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Dívidas Totais
            </CardTitle>
            <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold text-expense">
              {formatCurrency(stats?.totalDebts || 0)}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Metas Ativas
            </CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold text-goal">
              {formatCurrency(stats?.totalGoals || 0)}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
          className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Contas Bancárias
            </CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-lg sm:text-2xl font-bold">
              {stats?.accountsCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card
        style={{
          background: "var(--card-gradient)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas 5 transações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma transação encontrada
              </p>
            ) : (
              stats?.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description || "Sem descrição"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.categories?.name || "Sem categoria"} •{" "}
                      {transaction.bank_accounts?.name} •{" "}
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        transaction.type === "receita"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {transaction.type === "receita" ? "+" : "-"}
                      {formatCurrency(Math.abs(Number(transaction.value)))}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Nova Transação */}
      <Dialog
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
      >
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
              <Select
                value={formData.type}
                onValueChange={(value: "receita" | "despesa") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, value: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="Descrição da transação"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((cat) => cat.type === formData.type)
                    .map((category) => (
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
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bank_account_id: value }))
                }
              >
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transaction_date: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransactionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={
                !formData.value.trim() ||
                !formData.bank_account_id ||
                !formData.transaction_date
              }
              className="w-full sm:w-auto"
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

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface RecurringTransaction {
  id: string;
  type: "receita" | "despesa";
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

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
}

interface BankAccount {
  id: string;
  name: string;
}

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

const RecurringTransactions = () => {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [pausingTransaction, setPausingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState({
    type: "receita" as "receita" | "despesa",
    description: "",
    value: "",
    category_id: "",
    bank_account_id: "",
    frequency: "monthly",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (user) {
      loadRecurringTransactions();
      loadCategories();
      loadBankAccounts();
    }
  }, [user]);

  const loadRecurringTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select(
          `
          id, type, value, description, start_date, end_date, frequency, next_occurrence_date, created_at,
          categories(name),
          bank_accounts(name)
        `
        )
        .eq("user_id", user.id)
        .order("next_occurrence_date", { ascending: true });

      if (error) throw error;
      setRecurringTransactions(data || []);
    } catch (error) {
      console.error("Erro ao carregar transações recorrentes:", error);
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
        .eq("user_id", user.id)
        .order("name");

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
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas bancárias:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString("pt-BR");
  };

  const getDaysUntilNext = (nextDate: string) => {
    const today = new Date();
    const next = new Date(nextDate + 'T00:00:00');
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isActive = (transaction: RecurringTransaction) => {
    const today = new Date().toISOString().split("T")[0];
    const hasEndDate = transaction.end_date;
    return !hasEndDate || transaction.end_date >= today;
  };

  const resetForm = () => {
    setFormData({
      type: "receita",
      description: "",
      value: "",
      category_id: "",
      bank_account_id: "",
      frequency: "monthly",
      start_date: "",
      end_date: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditModal = async (transaction: RecurringTransaction) => {
    try {
      // Get full transaction details including category_id and bank_account_id
      const { data: fullTransaction, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("id", transaction.id)
        .single();

      if (error) throw error;

      setFormData({
        type: transaction.type,
        description: transaction.description,
        value: transaction.value.toString(),
        category_id: fullTransaction.category_id || "",
        bank_account_id: fullTransaction.bank_account_id || "",
        frequency: transaction.frequency,
        start_date: transaction.start_date.split("T")[0],
        end_date: transaction.end_date
          ? transaction.end_date.split("T")[0]
          : "",
      });
      setEditingTransaction(transaction);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados da transação:", error);
      // Fallback to original logic if query fails
      setFormData({
        type: transaction.type,
        description: transaction.description,
        value: transaction.value.toString(),
        category_id: "",
        bank_account_id: "",
        frequency: transaction.frequency,
        start_date: transaction.start_date.split("T")[0],
        end_date: transaction.end_date
          ? transaction.end_date.split("T")[0]
          : "",
      });
      setEditingTransaction(transaction);
      setEditModalOpen(true);
    }
  };

  const openDeleteModal = (transaction: RecurringTransaction) => {
    setDeletingTransaction(transaction);
    setDeleteModalOpen(true);
  };

  const openPauseModal = (transaction: RecurringTransaction) => {
    setPausingTransaction(transaction);
    setPauseModalOpen(true);
  };

  const handleCreate = async () => {
    if (
      !user ||
      !formData.description.trim() ||
      !formData.value ||
      !formData.bank_account_id ||
      !formData.start_date
    )
      return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const startDate = formData.start_date;
      const endDate = formData.end_date || null;

      // Calculate next occurrence date based on start date and frequency
      const startDateObj = new Date(startDate + 'T00:00:00');
      let nextDate = new Date(startDateObj);

      // If start date is today or in the past, create the first transaction and calculate next occurrence
      const shouldCreateFirstTransaction =
        startDate <= today && (!endDate || endDate > today);

      if (shouldCreateFirstTransaction) {
        // Create the first transaction
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              type: formData.type,
              value: parseFloat(formData.value),
              description: `${formData.description.trim()} (Primeira ocorrência automática)`,
              transaction_date: startDate,
              category_id: formData.category_id || null,
              bank_account_id: formData.bank_account_id,
            },
          ]);

        if (transactionError) {
          console.error("Erro ao criar primeira transação:", transactionError);
        }

        // Calculate next occurrence from start date
        switch (formData.frequency) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case "yearly":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
      } else {
        // If start date is in the future, the first occurrence is the start date itself
        nextDate = new Date(startDateObj);
      }

      const nextOccurrenceDate = nextDate.toISOString().split("T")[0];

      // Check if the recurring transaction should be automatically paused
      let effectiveEndDate = endDate;
      if (endDate && endDate <= today) {
        effectiveEndDate = endDate;
      }

      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert([
          {
            user_id: user.id,
            type: formData.type,
            description: formData.description.trim(),
            value: parseFloat(formData.value),
            category_id: formData.category_id || null,
            bank_account_id: formData.bank_account_id,
            frequency: formData.frequency,
            start_date: startDate,
            end_date: effectiveEndDate,
            next_occurrence_date: nextOccurrenceDate,
          },
        ])
        .select();

      if (error) throw error;

      await loadRecurringTransactions();
      setCreateModalOpen(false);
      resetForm();

      // Show success message with status
      const isActive = !effectiveEndDate || effectiveEndDate > today;
      const message = shouldCreateFirstTransaction
        ? `Transação recorrente criada e primeira ocorrência executada - Status: ${
            isActive ? "Ativa" : "Inativa"
          }`
        : `Transação recorrente criada - Status: ${
            isActive ? "Ativa" : "Inativa"
          }`;
    } catch (error) {
      console.error("Erro ao criar transação recorrente:", error);
    }
  };

  const handleEdit = async () => {
    if (
      !editingTransaction ||
      !formData.description.trim() ||
      !formData.value ||
      !formData.bank_account_id ||
      !formData.start_date
    )
      return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const startDate = formData.start_date;
      const endDate = formData.end_date || null;

      // Calculate appropriate next occurrence date based on changes
      let nextOccurrenceDate = editingTransaction.next_occurrence_date;

      // If frequency changed, recalculate next occurrence
      if (formData.frequency !== editingTransaction.frequency) {
        const currentNextDate = new Date(
          editingTransaction.next_occurrence_date + 'T00:00:00'
        );

        // Recalculate based on new frequency
        switch (formData.frequency) {
          case "daily":
            nextOccurrenceDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];
            break;
          case "weekly":
            nextOccurrenceDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];
            break;
          case "monthly":
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextOccurrenceDate = nextMonth.toISOString().split("T")[0];
            break;
          case "yearly":
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            nextOccurrenceDate = nextYear.toISOString().split("T")[0];
            break;
          default:
            const defaultNext = new Date();
            defaultNext.setMonth(defaultNext.getMonth() + 1);
            nextOccurrenceDate = defaultNext.toISOString().split("T")[0];
        }
      }

      // If end date is set and is in the past or today, the transaction becomes inactive
      let effectiveEndDate = endDate;
      if (endDate && endDate <= today) {
        effectiveEndDate = endDate;
      }

      // If transaction was inactive and end_date is removed or moved to future, reactivate
      if (!endDate || (endDate && endDate > today)) {
        // If removing end date or setting future end date, ensure next occurrence is appropriate
        if (nextOccurrenceDate <= today) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          nextOccurrenceDate = tomorrow.toISOString().split("T")[0];
        }
      }

      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          type: formData.type,
          description: formData.description.trim(),
          value: parseFloat(formData.value),
          category_id: formData.category_id || null,
          bank_account_id: formData.bank_account_id,
          frequency: formData.frequency,
          start_date: startDate,
          end_date: effectiveEndDate,
          next_occurrence_date: nextOccurrenceDate,
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      await loadRecurringTransactions();
      setEditModalOpen(false);
      setEditingTransaction(null);
      resetForm();

      // Show success message with status
      const isActive = !effectiveEndDate || effectiveEndDate > today;
    } catch (error) {
      console.error("Erro ao editar transação recorrente:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", deletingTransaction.id);

      if (error) throw error;

      await loadRecurringTransactions();
      setDeleteModalOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      console.error("Erro ao deletar transação recorrente:", error);
    }
  };

  const handlePause = async () => {
    if (!pausingTransaction) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ end_date: today })
        .eq("id", pausingTransaction.id);

      if (error) throw error;

      await loadRecurringTransactions();
      setPauseModalOpen(false);
      setPausingTransaction(null);
    } catch (error) {
      console.error("Erro ao pausar transação recorrente:", error);
    }
  };

  const calculateNextOccurrence = (
    currentOccurrenceDate: string,
    frequency: string
  ): string => {
    const date = new Date(currentOccurrenceDate + 'T00:00:00');

    switch (frequency) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date.toISOString().split("T")[0];
  };

  const handleExecuteNow = async (transaction: RecurringTransaction) => {
    if (!user) return;

    try {
      // First, get the full transaction details including category_id and bank_account_id
      const { data: fullTransaction, error: fetchError } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("id", transaction.id)
        .single();

      if (fetchError) throw fetchError;

      // Create the regular transaction
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            type: transaction.type,
            value: transaction.value,
            description: `${transaction.description} (Executado manualmente)`,
            transaction_date: new Date().toISOString().split("T")[0],
            category_id: fullTransaction.category_id,
            bank_account_id: fullTransaction.bank_account_id,
          },
        ]);

      if (insertError) throw insertError;

      // Update the next occurrence date
      const nextOccurrence = calculateNextOccurrence(
        transaction.next_occurrence_date,
        transaction.frequency
      );

      const { error: updateError } = await supabase
        .from("recurring_transactions")
        .update({ next_occurrence_date: nextOccurrence })
        .eq("id", transaction.id);

      if (updateError) throw updateError;

      // Reload the recurring transactions to show updated next occurrence
      await loadRecurringTransactions();
    } catch (error) {
      console.error("Erro ao executar transação:", error);
    }
  };

  const handleReactivate = async (transaction: RecurringTransaction) => {
    try {
      // Remove the end_date to reactivate the transaction
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          end_date: null,
          next_occurrence_date: new Date().toISOString().split("T")[0], // Set next occurrence to today
        })
        .eq("id", transaction.id);

      if (error) throw error;

      await loadRecurringTransactions();
    } catch (error) {
      console.error("Erro ao reativar transação:", error);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  const activeTransactions = recurringTransactions.filter(isActive);
  const inactiveTransactions = recurringTransactions.filter(
    (t) => !isActive(t)
  );

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Transações Recorrentes
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie suas receitas e despesas automáticas
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          style={{ background: "var(--income-gradient)" }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Recorrência
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {recurringTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--income-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Ativas
            </CardTitle>
            <Play className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {activeTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Receitas
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">
              {recurringTransactions.filter((t) => t.type === "receita").length}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Despesas
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-expense">
              {recurringTransactions.filter((t) => t.type === "despesa").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Ativas */}
      <Card
        style={{
          background: "var(--card-gradient)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
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
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma transação ativa
              </h3>
              <p className="text-muted-foreground mb-6">
                Crie transações recorrentes para automatizar suas finanças
              </p>
              <Button
                onClick={openCreateModal}
                style={{ background: "var(--income-gradient)" }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Primeira Recorrência
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile-friendly layout for active transactions */}
              <div className="block sm:hidden space-y-3">
                {activeTransactions.map((transaction) => {
                  const daysUntilNext = getDaysUntilNext(
                    transaction.next_occurrence_date
                  );
                  const isUpcoming = daysUntilNext <= 3 && daysUntilNext >= 0;
                  const isOverdue = daysUntilNext < 0;

                  return (
                    <Card key={transaction.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">
                              {transaction.description || "Sem descrição"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {transaction.categories?.name || "Sem categoria"}{" "}
                              • {transaction.bank_accounts.name}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Executar agora"
                              onClick={() => handleExecuteNow(transaction)}
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(transaction)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              onClick={() => openPauseModal(transaction)}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              onClick={() => openDeleteModal(transaction)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {frequencyLabels[transaction.frequency] ||
                                transaction.frequency}
                            </Badge>
                            <Badge
                              variant={
                                transaction.type === "receita"
                                  ? "default"
                                  : "destructive"
                              }
                              className={`text-xs ${
                                transaction.type === "receita"
                                  ? "bg-success text-success-foreground"
                                  : "bg-expense text-expense-foreground"
                              }`}
                            >
                              {transaction.type === "receita"
                                ? "Receita"
                                : "Despesa"}
                            </Badge>
                          </div>
                          <span
                            className={`font-mono font-semibold ${
                              transaction.type === "receita"
                                ? "text-success"
                                : "text-expense"
                            }`}
                          >
                            {transaction.type === "receita" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.value))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Próxima:
                          </span>
                          <div className="text-right">
                            <p
                              className={
                                isOverdue
                                  ? "text-destructive font-semibold"
                                  : isUpcoming
                                  ? "text-warning font-semibold"
                                  : ""
                              }
                            >
                              {formatDate(transaction.next_occurrence_date)}
                            </p>
                            <p
                              className={`text-xs ${
                                isOverdue
                                  ? "text-destructive"
                                  : isUpcoming
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isOverdue
                                ? `Atrasada ${Math.abs(daysUntilNext)} dia(s)`
                                : daysUntilNext === 0
                                ? "Hoje!"
                                : `Em ${daysUntilNext} dia(s)`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table layout */}
              <div className="hidden sm:block">
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
                      const daysUntilNext = getDaysUntilNext(
                        transaction.next_occurrence_date
                      );
                      const isUpcoming =
                        daysUntilNext <= 3 && daysUntilNext >= 0;
                      const isOverdue = daysUntilNext < 0;

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description || "Sem descrição"}
                          </TableCell>
                          <TableCell>
                            {transaction.categories?.name || "Sem categoria"}
                          </TableCell>
                          <TableCell>
                            {transaction.bank_accounts.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {frequencyLabels[transaction.frequency] ||
                                transaction.frequency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p
                                className={
                                  isOverdue
                                    ? "text-destructive font-semibold"
                                    : isUpcoming
                                    ? "text-warning font-semibold"
                                    : ""
                                }
                              >
                                {formatDate(transaction.next_occurrence_date)}
                              </p>
                              <p
                                className={`text-xs ${
                                  isOverdue
                                    ? "text-destructive"
                                    : isUpcoming
                                    ? "text-warning"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isOverdue
                                  ? `Atrasada ${Math.abs(daysUntilNext)} dia(s)`
                                  : daysUntilNext === 0
                                  ? "Hoje!"
                                  : `Em ${daysUntilNext} dia(s)`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.type === "receita"
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                transaction.type === "receita"
                                  ? "bg-success text-success-foreground"
                                  : "bg-expense text-expense-foreground"
                              }
                            >
                              {transaction.type === "receita"
                                ? "Receita"
                                : "Despesa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span
                              className={
                                transaction.type === "receita"
                                  ? "text-success"
                                  : "text-expense"
                              }
                            >
                              {transaction.type === "receita" ? "+" : "-"}
                              {formatCurrency(Math.abs(transaction.value))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Executar agora"
                                onClick={() => handleExecuteNow(transaction)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openPauseModal(transaction)}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openDeleteModal(transaction)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transações Inativas */}
      {inactiveTransactions.length > 0 && (
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
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
            <>
              {/* Mobile-friendly layout for inactive transactions */}
              <div className="block sm:hidden space-y-3">
                {inactiveTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4 opacity-60">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">
                            {transaction.description || "Sem descrição"}
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{formatDate(transaction.start_date)} até</p>
                            <p>
                              {transaction.end_date
                                ? formatDate(transaction.end_date)
                                : "Indefinido"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Reativar"
                            onClick={() => handleReactivate(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            onClick={() => openDeleteModal(transaction)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {transaction.type === "receita"
                            ? "Receita"
                            : "Despesa"}
                        </Badge>
                        <span className="font-mono font-semibold">
                          {formatCurrency(transaction.value)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden sm:block">
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
                          {transaction.description || "Sem descrição"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{formatDate(transaction.start_date)} até</p>
                            <p>
                              {transaction.end_date
                                ? formatDate(transaction.end_date)
                                : "Indefinido"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.type === "receita"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(transaction.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Reativar"
                              onClick={() => handleReactivate(transaction)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteModal(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          </CardContent>
        </Card>
      )}

      {/* Modal para Nova Transação Recorrente */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2">
          <DialogHeader>
            <DialogTitle>Nova Transação Recorrente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "receita" | "despesa") =>
                    setFormData({ ...formData, type: value, category_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição da transação recorrente"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category_id">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bank_account_id">Conta Bancária</Label>
                <Select
                  value={formData.bank_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bank_account_id: value })
                  }
                >
                  <SelectTrigger>
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
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">Data de Fim (Opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              style={{ background: "var(--income-gradient)" }}
              className="w-full sm:w-auto"
            >
              Criar Recorrência
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Transação Recorrente */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2">
          <DialogHeader>
            <DialogTitle>Editar Transação Recorrente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "receita" | "despesa") =>
                    setFormData({ ...formData, type: value, category_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-value">Valor</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição da transação recorrente"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-category_id">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bank_account_id">Conta Bancária</Label>
                <Select
                  value={formData.bank_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bank_account_id: value })
                  }
                >
                  <SelectTrigger>
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
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-frequency">Frequência</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-start_date">Data de Início</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end_date">Data de Fim (Opcional)</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              style={{ background: "var(--income-gradient)" }}
              className="w-full sm:w-auto"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação recorrente "
              {deletingTransaction?.description}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação de Pausa */}
      <AlertDialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pausar Transação Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja pausar a transação recorrente "
              {pausingTransaction?.description}"? Ela será movida para a lista
              de transações inativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePause}
              className="bg-warning text-warning-foreground hover:bg-warning/90 w-full sm:w-auto"
            >
              Pausar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecurringTransactions;

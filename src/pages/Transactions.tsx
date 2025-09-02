import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: string;
  type: "receita" | "despesa";
  value: number;
  description: string | null;
  transaction_date: string;
  category_id: string | null;
  bank_account_id: string;
  categories: { name: string } | null;
  bank_accounts: { name: string };
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

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(
    new Date().toISOString().slice(0, 7)
  ); // Formato YYYY-MM
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
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
      loadTransactions();
      loadCategories();
      loadBankAccounts();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id, type, value, description, transaction_date, category_id, bank_account_id,
          categories(name),
          bank_accounts(name)
        `
        )
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
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

  const handleCreate = async () => {
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

      setCreateModalOpen(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    }
  };

  const handleEdit = async () => {
    if (
      !user ||
      !editingTransaction ||
      !formData.value.trim() ||
      !formData.bank_account_id ||
      !formData.transaction_date
    )
      return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: formData.type,
          value: parseFloat(formData.value),
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          bank_account_id: formData.bank_account_id,
          transaction_date: formData.transaction_date,
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error("Erro ao editar transação:", error);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;

      loadTransactions();
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      value: transaction.value.toString(),
      description: transaction.description || "",
      category_id: transaction.category_id || "",
      bank_account_id: transaction.bank_account_id,
      transaction_date: transaction.transaction_date,
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const getCurrentMonthDisplay = () => {
    return formatMonthYear(monthFilter);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.categories?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    // Garantir que a comparação de data funcione corretamente
    const transactionMonth = transaction.transaction_date.substring(0, 7); // YYYY-MM
    const matchesMonth = transactionMonth === monthFilter;
    return matchesSearch && matchesType && matchesMonth;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Transações</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todas as suas receitas e despesas
          </p>
        </div>
        <Button
          style={{ background: "var(--income-gradient)" }}
          onClick={openCreateModal}
          className="w-full sm:w-auto"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <Card
        style={{
          background: "var(--card-gradient)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre suas transações por tipo, mês ou busque por descrição
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select
                  value={monthFilter.split("-")[1]}
                  onValueChange={(month) => {
                    const year = monthFilter.split("-")[0];
                    setMonthFilter(`${year}-${month.padStart(2, "0")}`);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-32 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const date = new Date(2024, month - 1);
                      return (
                        <SelectItem
                          key={month}
                          value={month.toString().padStart(2, "0")}
                        >
                          {date.toLocaleDateString("pt-BR", {
                            month: "short",
                          })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select
                  value={monthFilter.split("-")[0]}
                  onValueChange={(year) => {
                    const month = monthFilter.split("-")[1];
                    setMonthFilter(`${year}-${month}`);
                  }}
                >
                  <SelectTrigger className="w-20 sm:w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() =>
                    setMonthFilter(new Date().toISOString().slice(0, 7))
                  }
                  className="h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  Atual
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        style={{
          background: "var(--card-gradient)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transação(ões) encontrada(s) em{" "}
            {formatMonthYear(monthFilter)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm sm:text-base">
                Nenhuma transação encontrada
              </p>
            </div>
          ) : (
            <>
              <div className="block sm:hidden space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {transaction.description || "Sem descrição"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.transaction_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={
                            transaction.type === "receita"
                              ? "text-success font-mono text-sm"
                              : "text-expense font-mono text-sm"
                          }
                        >
                          {transaction.type === "receita" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.value))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col space-y-1">
                        <Badge
                          variant={
                            transaction.type === "receita"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            transaction.type === "receita"
                              ? "bg-success text-white text-xs w-fit"
                              : "bg-expense text-white text-xs w-fit"
                          }
                        >
                          {transaction.type === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {transaction.categories?.name || "Sem categoria"} • {transaction.bank_accounts.name}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(transaction)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá
                                deletar permanentemente esta transação.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(transaction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Data</TableHead>
                      <TableHead className="text-xs sm:text-sm">Descrição</TableHead>
                      <TableHead className="text-xs sm:text-sm">Categoria</TableHead>
                      <TableHead className="text-xs sm:text-sm">Conta</TableHead>
                      <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Valor</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs sm:text-sm">
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {transaction.description || "Sem descrição"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {transaction.categories?.name || "Sem categoria"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{transaction.bank_accounts.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "receita"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              transaction.type === "receita"
                                ? "bg-success text-white text-xs"
                                : "bg-expense text-white text-xs"
                            }
                          >
                            {transaction.type === "receita" ? "Receita" : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
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
                          <div className="flex gap-1 sm:gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(transaction)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá
                                    deletar permanentemente esta transação.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                                  <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(transaction.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Registre uma nova transação financeira
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-left sm:text-right font-medium">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "receita" | "despesa") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-left sm:text-right font-medium">
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
                className="col-span-1 sm:col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-left sm:text-right font-medium">
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
                className="col-span-1 sm:col-span-3"
                placeholder="Descrição da transação"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-left sm:text-right font-medium">
                Categoria
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="bank_account" className="text-left sm:text-right font-medium">
                Conta Bancária *
              </Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bank_account_id: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_date" className="text-left sm:text-right font-medium">
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
                className="col-span-1 sm:col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
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

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>Altere os dados da transação</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-left sm:text-right font-medium">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "receita" | "despesa") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-value" className="text-left sm:text-right font-medium">
                Valor *
              </Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, value: e.target.value }))
                }
                className="col-span-1 sm:col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-left sm:text-right font-medium">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="col-span-1 sm:col-span-3"
                placeholder="Descrição da transação"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-left sm:text-right font-medium">
                Categoria
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bank_account" className="text-left sm:text-right font-medium">
                Conta Bancária *
              </Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bank_account_id: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-transaction_date" className="text-left sm:text-right font-medium">
                Data *
              </Label>
              <Input
                id="edit-transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transaction_date: e.target.value,
                  }))
                }
                className="col-span-1 sm:col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !formData.value.trim() ||
                !formData.bank_account_id ||
                !formData.transaction_date
              }
              className="w-full sm:w-auto"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;

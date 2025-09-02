import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Target, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  type: "receita" | "despesa";
  target_value: number;
  start_period: string;
  end_period: string;
  category_id: string | null;
  categories: { name: string } | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
}

interface GoalProgress {
  goal: Goal;
  currentValue: number;
  progressPercentage: number;
  remainingDays: number;
  isCompleted: boolean;
}

const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addValueModalOpen, setAddValueModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "receita" as "receita" | "despesa",
    target_value: "",
    start_period: "",
    end_period: "",
    category_id: "all", // Mudando de "" para "all"
  });

  // Estado para adicionar valor
  const [addValueData, setAddValueData] = useState({
    value: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fallback modal state
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals();
      loadCategories();
    }
  }, [user]);

  // Cleanup effect for modals
  useEffect(() => {
    return () => {
      // Cleanup modals when component unmounts
      setCreateModalOpen(false);
      setEditModalOpen(false);
      setAddValueModalOpen(false);
      setSelectedGoal(null);
      setEditingGoal(null);
      resetForm();
    };
  }, []);

  // Global error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      // Só mostrar erro para erros críticos, não para erros de UI
      if (
        event.error &&
        event.error.message &&
        !event.error.message.includes("React") &&
        !event.error.message.includes("Select.Item") &&
        !event.error.message.includes("value prop")
      ) {
        setError("Ocorreu um erro inesperado. Por favor, recarregue a página.");
        toast({
          title: "Erro",
          description:
            "Ocorreu um erro inesperado. Por favor, recarregue a página.",
          variant: "destructive",
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      // Só mostrar erro para rejeições críticas
      if (
        event.reason &&
        typeof event.reason === "string" &&
        !event.reason.includes("React") &&
        !event.reason.includes("Select.Item") &&
        !event.reason.includes("value prop")
      ) {
        setError("Ocorreu um erro inesperado. Por favor, recarregue a página.");
        toast({
          title: "Erro",
          description:
            "Ocorreu um erro inesperado. Por favor, recarregue a página.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [toast]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      setError(null);

      // Buscar metas com JOIN para obter o progresso
      const { data: goalsData, error: goalsError } = await supabase
        .from("financial_goals")
        .select(
          `
          id, type, target_value, start_period, end_period, category_id, created_at,
          categories(name)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // Para cada meta, buscar o progresso da tabela goal_progress
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          // Buscar o progresso total da meta
          const { data: progressData, error: progressError } = await supabase
            .from("goal_progress")
            .select("value")
            .eq("goal_id", goal.id);

          if (progressError) {
            console.error("Erro ao buscar progresso:", progressError);
          }

          const currentValue =
            progressData?.reduce((sum, p) => sum + Number(p.value), 0) || 0;
          const progressPercentage = (currentValue / goal.target_value) * 100;

          // Cálculo correto dos dias restantes: data atual vs data final da meta
          const today = new Date();
          const endDate = new Date(goal.end_period);
          const remainingDays = Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          const isCompleted = currentValue >= goal.target_value;

          return {
            goal,
            currentValue,
            progressPercentage: Math.min(progressPercentage, 100),
            remainingDays,
            isCompleted,
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      setError("Erro ao carregar metas financeiras.");
      toast({
        title: "Erro",
        description: "Erro ao carregar metas financeiras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("user_id", user.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setError("Erro ao carregar categorias.");
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "receita",
      target_value: "",
      start_period: "",
      end_period: "",
      category_id: "all", // Mudando de "" para "all"
    });
  };

  const handleCreate = async () => {
    if (
      !user ||
      !formData.target_value.trim() ||
      !formData.start_period ||
      !formData.end_period
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from("financial_goals")
        .insert([
          {
            user_id: user.id,
            type: formData.type,
            target_value: parseFloat(formData.target_value),
            start_period: formData.start_period,
            end_period: formData.end_period,
            category_id:
              formData.category_id === "all" ? null : formData.category_id, // Ajustando para "all"
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCreateModalOpen(false);
      resetForm();
      await loadGoals();

      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      setError("Erro ao criar meta financeira.");
      toast({
        title: "Erro",
        description: "Erro ao criar meta financeira.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (
      !user ||
      !editingGoal ||
      !formData.target_value.trim() ||
      !formData.start_period ||
      !formData.end_period
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from("financial_goals")
        .update({
          type: formData.type,
          target_value: parseFloat(formData.target_value),
          start_period: formData.start_period,
          end_period: formData.end_period,
          category_id:
            formData.category_id === "all" ? null : formData.category_id, // Ajustando para "all"
        })
        .eq("id", editingGoal.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingGoal(null);
      resetForm();
      await loadGoals();

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao editar meta:", error);
      setError("Erro ao atualizar meta financeira.");
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta financeira.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!user) return;

    try {
      setError(null);
      
      // Primeiro, deletar todos os registros de progresso relacionados a esta meta
      const { error: progressError } = await supabase
        .from("goal_progress")
        .delete()
        .eq("goal_id", goalId);

      if (progressError) {
        console.error("Erro ao deletar progresso da meta:", progressError);
        throw new Error("Erro ao deletar progresso da meta.");
      }

      // Depois, deletar a meta
      const { error: goalError } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", goalId);

      if (goalError) throw goalError;

      await loadGoals();

      toast({
        title: "Sucesso",
        description: "Meta e todos os seus progressos foram deletados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao deletar meta financeira.";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      target_value: goal.target_value.toString(),
      start_period: goal.start_period,
      end_period: goal.end_period,
      category_id: goal.category_id || "all", // Mudando de "" para "all"
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingGoal(null);
    resetForm();
  };

  // Funções para adicionar valor
  const openAddValueModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setAddValueData({
      value: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setAddValueModalOpen(true);
  };

  const closeAddValueModal = () => {
    setAddValueModalOpen(false);
    setSelectedGoal(null);
    setAddValueData({
      value: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleAddValue = async () => {
    if (!user || !selectedGoal || !addValueData.value.trim() || !addValueData.date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (valor e data).",
        variant: "destructive",
      });
      return;
    }

    const value = parseFloat(addValueData.value);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser um número maior que zero.",
        variant: "destructive",
      });
      return;
    }

    // Validar se a data está dentro do período da meta
    const selectedDate = new Date(addValueData.date);
    const startDate = new Date(selectedGoal.start_period);
    const endDate = new Date(selectedGoal.end_period);

    if (selectedDate < startDate || selectedDate > endDate) {
      toast({
        title: "Erro",
        description: "A data deve estar dentro do período da meta.",
        variant: "destructive",
      });
      return;
    }

    try {
      setError(null);

      // Verificar se já existe um registro para esta meta na mesma data
      const { data: existingProgress, error: checkError } = await supabase
        .from("goal_progress")
        .select("id, value, description")
        .eq("goal_id", selectedGoal.id)
        .eq("progress_date", addValueData.date)
        .limit(1);

      if (checkError) {
        console.error("Erro ao verificar progresso existente:", checkError);
      }

      // Preparar dados para inserção/atualização
      const progressData = {
        user_id: user.id,
        goal_id: selectedGoal.id,
        value: parseFloat(value.toString()),
        description: addValueData.description?.trim() || 
          `Progresso da meta: ${selectedGoal.type === "receita" ? "Receita" : "Despesa"}`,
        progress_date: addValueData.date,
      };

      let insertedData, progressError;

      if (existingProgress && existingProgress.length > 0) {
        // Atualizar o registro existente, somando o novo valor ao valor atual
        const existingRecord = existingProgress[0];
        const newTotalValue = parseFloat(existingRecord.value.toString()) + parseFloat(value.toString());
        const newDescription = `${existingRecord.description} + ${addValueData.description || `R$ ${value.toFixed(2)}`}`;

        const result = await supabase
          .from("goal_progress")
          .update({
            value: newTotalValue,
            description: newDescription,
          })
          .eq("id", existingRecord.id)
          .select();
        
        insertedData = result.data;
        progressError = result.error;
      } else {
        // Inserir novo registro
        const result = await supabase
          .from("goal_progress")
          .insert([progressData])
          .select();
        
        insertedData = result.data;
        progressError = result.error;
      }

      if (progressError) {
        console.error("Erro detalhado ao inserir progresso:", progressError);
        throw new Error(`Erro ao registrar progresso: ${progressError.message || progressError}`);
      }

      setAddValueModalOpen(false);
      setSelectedGoal(null);
      setAddValueData({
        value: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      // Recarregar as metas para mostrar o progresso atualizado
      await loadGoals();

      const wasUpdated = existingProgress && existingProgress.length > 0;
      toast({
        title: "Sucesso",
        description: wasUpdated 
          ? `Valor de ${formatCurrency(value)} adicionado ao progresso existente da data ${formatDate(addValueData.date)}.`
          : `Valor de ${formatCurrency(value)} registrado com sucesso para ${formatDate(addValueData.date)}.`,
      });
    } catch (error) {
      console.error("Erro ao adicionar valor:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar valor à meta.";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    } catch (error) {
      return `R$ ${value.toFixed(2)}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch (error) {
      return dateString;
    }
  };

  const incomeGoals = goals.filter((g) => g.goal.type === "receita");
  const expenseGoals = goals.filter((g) => g.goal.type === "despesa");
  const completedGoals = goals.filter((g) => g.isCompleted);

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Metas Financeiras
            </h2>
            <p className="text-muted-foreground">
              Defina e acompanhe suas metas de receitas e despesas
            </p>
          </div>
        </div>

        <Card className="p-6 text-center">
          <div className="space-y-4">
            <Target className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-destructive">
              Erro ao carregar dados
            </h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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

  const GoalGrid = ({
    goalsList,
    type,
  }: {
    goalsList: GoalProgress[];
    type: "receita" | "despesa";
  }) => (
    <div className="space-y-4">
      {goalsList.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhuma meta de {type === "receita" ? "receita" : "despesa"}
          </h3>
          <p className="text-muted-foreground mb-6">
            Defina metas para controlar melhor suas{" "}
            {type === "receita" ? "receitas" : "despesas"}
          </p>
          <Button
            style={{
              background:
                type === "receita"
                  ? "var(--goal-gradient)"
                  : "var(--expense-gradient)",
            }}
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goalsList.map((goalData) => {
            const {
              goal,
              currentValue,
              progressPercentage,
              remainingDays,
              isCompleted,
            } = goalData;

            return (
              <Card
                key={goal.id}
                style={{
                  background: "var(--card-gradient)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Meta de {goal.type === "receita" ? "Receita" : "Despesa"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          goal.type === "receita" ? "default" : "destructive"
                        }
                        className={
                          goal.type === "receita"
                            ? "bg-success text-success-foreground"
                            : "bg-expense text-expense-foreground"
                        }
                      >
                        {goal.categories?.name || "Todas as categorias"}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-goal text-goal-foreground">
                          Concluída!
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(goal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddValueModal(goal)}
                      title="Registrar progresso da meta (salvo no banco de dados)"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá deletar
                            permanentemente esta meta financeira e todos os seus progressos registrados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(goal.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold">
                          {formatCurrency(currentValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-semibold">
                          {formatCurrency(goal.target_value)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Progresso
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isCompleted ? "text-goal" : "text-muted-foreground"
                          }`}
                        >
                          {progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs mt-1 text-muted-foreground">
                        Restam:{" "}
                        {formatCurrency(
                          Math.max(0, goal.target_value - currentValue)
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">
                          {formatDate(goal.start_period)} até{" "}
                          {formatDate(goal.end_period)}
                        </p>
                        <p
                          className={`text-xs ${
                            remainingDays < 0
                              ? "text-destructive"
                              : remainingDays <= 7
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        >
                          {remainingDays < 0
                            ? `Prazo expirado há ${Math.abs(
                                remainingDays
                              )} dia(s)`
                            : remainingDays === 0
                            ? "Último dia!"
                            : remainingDays === 1
                            ? "1 dia restante"
                            : `${remainingDays} dias restantes`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Metas Financeiras
          </h2>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas de receitas e despesas
          </p>
        </div>
        <Button
          style={{ background: "var(--goal-gradient)" }}
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Estatísticas das Metas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Metas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--goal-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Concluídas
            </CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {completedGoals.length}
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
            <CardTitle className="text-sm font-medium text-white">
              Metas de Receita
            </CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {incomeGoals.length}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--expense-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Metas de Despesa
            </CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {expenseGoals.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <Card
        style={{
          background: "var(--card-gradient)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <CardHeader>
          <CardTitle>Suas Metas Financeiras</CardTitle>
          <CardDescription>
            Acompanhe o progresso das suas metas organizadas por tipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas ({goals.length})</TabsTrigger>
              <TabsTrigger value="income">
                Receitas ({incomeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="expense">
                Despesas ({expenseGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Concluídas ({completedGoals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <GoalGrid goalsList={goals} type="receita" />
            </TabsContent>

            <TabsContent value="income" className="mt-6">
              <GoalGrid goalsList={incomeGoals} type="receita" />
            </TabsContent>

            <TabsContent value="expense" className="mt-6">
              <GoalGrid goalsList={expenseGoals} type="despesa" />
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <GoalGrid goalsList={completedGoals} type="receita" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto modal-container">
          <DialogHeader>
            <DialogTitle>Nova Meta Financeira</DialogTitle>
            <DialogDescription>
              Defina uma meta para acompanhar suas receitas ou despesas
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
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">Todas as categorias</SelectItem>
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
              <Label htmlFor="target_value" className="text-right">
                Valor Meta *
              </Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_value: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_period" className="text-right">
                Início *
              </Label>
              <Input
                id="start_period"
                type="date"
                value={formData.start_period}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_period: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_period" className="text-right">
                Fim *
              </Label>
              <Input
                id="end_period"
                type="date"
                value={formData.end_period}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    end_period: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.target_value.trim() ||
                !formData.start_period ||
                !formData.end_period
              }
            >
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto modal-container">
          <DialogHeader>
            <DialogTitle>Editar Meta Financeira</DialogTitle>
            <DialogDescription>
              Altere os dados da meta financeira
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
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
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Categoria
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">Todas as categorias</SelectItem>
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
              <Label htmlFor="edit-target_value" className="text-right">
                Valor Meta *
              </Label>
              <Input
                id="edit-target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_value: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-start_period" className="text-right">
                Início *
              </Label>
              <Input
                id="edit-start_period"
                type="date"
                value={formData.start_period}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_period: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-end_period" className="text-right">
                Fim *
              </Label>
              <Input
                id="edit-end_period"
                type="date"
                value={formData.end_period}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    end_period: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !formData.target_value.trim() ||
                !formData.start_period ||
                !formData.end_period
              }
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Valor */}
      <Dialog open={addValueModalOpen} onOpenChange={setAddValueModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto modal-container">
          <DialogHeader>
            <DialogTitle>Registrar Progresso da Meta</DialogTitle>
            <DialogDescription>
              Adicione valores para acompanhar o progresso desta meta. Se já existir um registro para a data selecionada, o valor será somado ao existente.
            </DialogDescription>
            {selectedGoal && (
              <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                <p>
                  <strong>Meta:</strong>{" "}
                  {selectedGoal.type === "receita" ? "Receita" : "Despesa"}
                </p>
                <p>
                  <strong>Período:</strong>{" "}
                  {formatDate(selectedGoal.start_period)} até{" "}
                  {formatDate(selectedGoal.end_period)}
                </p>
                <p>
                  <strong>Valor Atual:</strong>{" "}
                  {formatCurrency(
                    goals.find((g) => g.goal.id === selectedGoal.id)
                      ?.currentValue || 0
                  )}
                </p>
                <p>
                  <strong>Meta:</strong>{" "}
                  {formatCurrency(selectedGoal.target_value)}
                </p>
              </div>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-value" className="text-right">
                Valor *
              </Label>
              <Input
                id="add-value"
                type="number"
                step="0.01"
                value={addValueData.value}
                onChange={(e) =>
                  setAddValueData((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-description" className="text-right">
                Descrição
              </Label>
              <Input
                id="add-description"
                type="text"
                value={addValueData.description}
                onChange={(e) =>
                  setAddValueData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="Descrição opcional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-date" className="text-right">
                Data *
              </Label>
              <Input
                id="add-date"
                type="date"
                value={addValueData.date}
                onChange={(e) =>
                  setAddValueData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddValueModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddValue}
              disabled={!addValueData.value.trim() || !addValueData.date}
            >
              Registrar Progresso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Fallback - Caso o Dialog principal não funcione */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Meta Financeira</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFallbackModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fallback-type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "receita" | "despesa") =>
                    setFormData((prev) => ({ ...prev, type: value }))
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

              <div>
                <Label htmlFor="fallback-category">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
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

              <div>
                <Label htmlFor="fallback-target_value">Valor Meta *</Label>
                <Input
                  id="fallback-target_value"
                  type="number"
                  step="0.01"
                  value={formData.target_value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      target_value: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="fallback-start_period">Início *</Label>
                <Input
                  id="fallback-start_period"
                  type="date"
                  value={formData.start_period}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_period: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="fallback-end_period">Fim *</Label>
                <Input
                  id="fallback-end_period"
                  type="date"
                  value={formData.end_period}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_period: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowFallbackModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await handleCreate();
                  setShowFallbackModal(false);
                }}
                disabled={
                  !formData.target_value.trim() ||
                  !formData.start_period ||
                  !formData.end_period
                }
                className="flex-1"
              >
                Criar Meta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;

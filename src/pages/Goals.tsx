import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Goal {
  id: string;
  type: 'receita' | 'despesa';
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
  type: 'receita' | 'despesa';
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
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    type: 'receita' as 'receita' | 'despesa',
    target_value: '',
    start_period: '',
    end_period: '',
    category_id: ''
  });

  useEffect(() => {
    if (user) {
      loadGoals();
      loadCategories();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('financial_goals')
        .select(`
          id, type, target_value, start_period, end_period, category_id, created_at,
          categories(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Para cada meta, buscar o valor atual baseado nas transações
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          let query = supabase
            .from('transactions')
            .select('value')
            .eq('user_id', user.id)
            .eq('type', goal.type)
            .gte('transaction_date', goal.start_period)
            .lte('transaction_date', goal.end_period);

          if (goal.category_id) {
            query = query.eq('category_id', goal.category_id);
          }

          const { data: transactionsData } = await query;

          const currentValue = transactionsData?.reduce((sum, t) => sum + Number(t.value), 0) || 0;
          const progressPercentage = (currentValue / goal.target_value) * 100;
          const remainingDays = Math.ceil((new Date(goal.end_period).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isCompleted = currentValue >= goal.target_value;

          return {
            goal,
            currentValue,
            progressPercentage: Math.min(progressPercentage, 100),
            remainingDays,
            isCompleted
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
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

  const resetForm = () => {
    setFormData({
      type: 'receita',
      target_value: '',
      start_period: '',
      end_period: '',
      category_id: ''
    });
  };

  const handleCreate = async () => {
    if (!user || !formData.target_value.trim() || !formData.start_period || !formData.end_period) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert([{
          user_id: user.id,
          type: formData.type,
          target_value: parseFloat(formData.target_value),
          start_period: formData.start_period,
          end_period: formData.end_period,
          category_id: formData.category_id || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCreateModalOpen(false);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    }
  };

  const handleEdit = async () => {
    if (!user || !editingGoal || !formData.target_value.trim() || !formData.start_period || !formData.end_period) return;

    try {
      const { error } = await supabase
        .from('financial_goals')
        .update({
          type: formData.type,
          target_value: parseFloat(formData.target_value),
          start_period: formData.start_period,
          end_period: formData.end_period,
          category_id: formData.category_id || null
        })
        .eq('id', editingGoal.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingGoal(null);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Erro ao editar meta:', error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      loadGoals();
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
    }
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      target_value: goal.target_value.toString(),
      start_period: goal.start_period,
      end_period: goal.end_period,
      category_id: goal.category_id || ''
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
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

  const incomeGoals = goals.filter(g => g.goal.type === 'receita');
  const expenseGoals = goals.filter(g => g.goal.type === 'despesa');
  const completedGoals = goals.filter(g => g.isCompleted);

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

  const GoalGrid = ({ goalsList, type }: { goalsList: GoalProgress[], type: 'receita' | 'despesa' }) => (
    <div className="space-y-4">
      {goalsList.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhuma meta de {type === 'receita' ? 'receita' : 'despesa'}
          </h3>
          <p className="text-muted-foreground mb-6">
            Defina metas para controlar melhor suas {type === 'receita' ? 'receitas' : 'despesas'}
          </p>
          <Button style={{ background: type === 'receita' ? 'var(--goal-gradient)' : 'var(--expense-gradient)' }} onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goalsList.map((goalData) => {
            const { goal, currentValue, progressPercentage, remainingDays, isCompleted } = goalData;
            
            return (
              <Card key={goal.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Meta de {goal.type === 'receita' ? 'Receita' : 'Despesa'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge 
                        variant={goal.type === 'receita' ? 'default' : 'destructive'}
                        className={goal.type === 'receita' ? 'bg-success text-white' : 'bg-expense text-white'}
                      >
                        {goal.categories?.name || 'Todas as categorias'}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-goal text-white">
                          Concluída!
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(goal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente esta meta financeira.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                        <p className="font-semibold">{formatCurrency(currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-semibold">{formatCurrency(goal.target_value)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className={`text-sm font-semibold ${isCompleted ? 'text-goal' : 'text-muted-foreground'}`}>
                          {progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={progressPercentage} 
                        className="h-2"
                      />
                      <p className="text-xs mt-1 text-muted-foreground">
                        Restam: {formatCurrency(Math.max(0, goal.target_value - currentValue))}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">
                          {formatDate(goal.start_period)} até {formatDate(goal.end_period)}
                        </p>
                        <p className={`text-xs ${remainingDays < 0 ? 'text-destructive' : remainingDays <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {remainingDays < 0 
                            ? `Prazo expirado há ${Math.abs(remainingDays)} dia(s)`
                            : remainingDays === 0
                            ? 'Último dia!'
                            : `${remainingDays} dia(s) restantes`
                          }
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
          <h2 className="text-3xl font-bold tracking-tight">Metas Financeiras</h2>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas de receitas e despesas
          </p>
        </div>
        <Button style={{ background: 'var(--goal-gradient)' }} onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Estatísticas das Metas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--goal-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Concluídas</CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedGoals.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--income-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Metas de Receita</CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{incomeGoals.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--expense-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Metas de Despesa</CardTitle>
            <Target className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{expenseGoals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
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
              <TabsTrigger value="income">Receitas ({incomeGoals.length})</TabsTrigger>
              <TabsTrigger value="expense">Despesas ({expenseGoals.length})</TabsTrigger>
              <TabsTrigger value="completed">Concluídas ({completedGoals.length})</TabsTrigger>
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
        <DialogContent className="sm:max-w-[425px]">
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
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.filter(cat => cat.type === formData.type).map((category) => (
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
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, start_period: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, end_period: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.target_value.trim() || !formData.start_period || !formData.end_period}>
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
              <Label htmlFor="edit-category" className="text-right">
                Categoria
              </Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.filter(cat => cat.type === formData.type).map((category) => (
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
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, start_period: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, end_period: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!formData.target_value.trim() || !formData.start_period || !formData.end_period}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
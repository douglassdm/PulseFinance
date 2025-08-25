import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    original_amount: '',
    current_amount: '',
    interest_rate: '',
    due_date: '',
    creditor: '',
    description: ''
  });

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

  const resetForm = () => {
    setFormData({
      name: '',
      original_amount: '',
      current_amount: '',
      interest_rate: '',
      due_date: '',
      creditor: '',
      description: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setFormData({
      name: debt.name,
      original_amount: debt.original_amount.toString(),
      current_amount: debt.current_amount.toString(),
      interest_rate: debt.interest_rate?.toString() || '',
      due_date: debt.due_date ? debt.due_date.split('T')[0] : '',
      creditor: debt.creditor || '',
      description: debt.description || ''
    });
    setEditingDebt(debt);
    setEditModalOpen(true);
  };

  const openDeleteModal = (debt: Debt) => {
    setDeletingDebt(debt);
    setDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim() || !formData.original_amount) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          original_amount: parseFloat(formData.original_amount),
          current_amount: parseFloat(formData.current_amount) || parseFloat(formData.original_amount),
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
          due_date: formData.due_date || null,
          creditor: formData.creditor.trim() || null,
          description: formData.description.trim() || null
        }])
        .select();

      if (error) throw error;

      await loadDebts();
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar dívida:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingDebt || !formData.name.trim() || !formData.original_amount) return;

    try {
      const { error } = await supabase
        .from('debts')
        .update({
          name: formData.name.trim(),
          original_amount: parseFloat(formData.original_amount),
          current_amount: parseFloat(formData.current_amount) || parseFloat(formData.original_amount),
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
          due_date: formData.due_date || null,
          creditor: formData.creditor.trim() || null,
          description: formData.description.trim() || null
        })
        .eq('id', editingDebt.id);

      if (error) throw error;

      await loadDebts();
      setEditModalOpen(false);
      setEditingDebt(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao editar dívida:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingDebt) return;

    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', deletingDebt.id);

      if (error) throw error;

      await loadDebts();
      setDeleteModalOpen(false);
      setDeletingDebt(null);
    } catch (error) {
      console.error('Erro ao deletar dívida:', error);
    }
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
        <Button onClick={openCreateModal} style={{ background: 'var(--expense-gradient)' }}>
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
            <Button onClick={openCreateModal} style={{ background: 'var(--expense-gradient)' }}>
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
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(debt)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteModal(debt)}>
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

      {/* Modal para Nova Dívida */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Dívida</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Dívida</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="original_amount">Valor Original</Label>
                <Input
                  id="original_amount"
                  type="number"
                  step="0.01"
                  value={formData.original_amount}
                  onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_amount">Valor Atual</Label>
                <Input
                  id="current_amount"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Taxa de Juros (% ao ano)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditor">Credor</Label>
              <Input
                id="creditor"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                placeholder="Ex: Banco XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a dívida"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} style={{ background: 'var(--expense-gradient)' }}>
              Criar Dívida
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Dívida */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dívida</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome da Dívida</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-original_amount">Valor Original</Label>
                <Input
                  id="edit-original_amount"
                  type="number"
                  step="0.01"
                  value={formData.original_amount}
                  onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-current_amount">Valor Atual</Label>
                <Input
                  id="edit-current_amount"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-interest_rate">Taxa de Juros (% ao ano)</Label>
                <Input
                  id="edit-interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-due_date">Data de Vencimento</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-creditor">Credor</Label>
              <Input
                id="edit-creditor"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                placeholder="Ex: Banco XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a dívida"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} style={{ background: 'var(--expense-gradient)' }}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a dívida "{deletingDebt?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Debts;
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Debt {
  id: string;
  name: string;
  original_amount: number;
  current_amount: number;
  monthly_interest_rate: number | null;
  due_date: string | null;
  creditor: string | null;
  description: string | null;
  created_at: string;
  last_payment_date: string | null;
}

interface BankAccount {
  id: string;
  name: string;
}

const Debts = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    original_amount: '',
    monthly_interest_rate: '',
    due_date: '',
    creditor: '',
    description: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    bank_account_id: '',
    description: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      loadDebts();
      loadBankAccounts();
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateCurrentAmount = (debt: Debt) => {
    // Se não há taxa de juros definida ou é zero, retorna o valor atual armazenado
    if (!debt.monthly_interest_rate || debt.monthly_interest_rate <= 0) {
      return debt.current_amount;
    }

    // Se não há data de vencimento, não aplica juros automáticos
    if (!debt.due_date) {
      return debt.current_amount;
    }

    // Se há taxa de juros, calcula baseado na data de vencimento
    let baseDate: Date;
    
    if (debt.last_payment_date && debt.last_payment_date !== null) {
      // Se houve pagamento, usa a data do último pagamento
      baseDate = new Date(debt.last_payment_date);
    } else {
      // Se não houve pagamento, usa a data de vencimento
      baseDate = new Date(debt.due_date);
    }
    
    const now = new Date();
    
    // Se ainda não venceu, não aplica juros
    if (now <= baseDate && !debt.last_payment_date) {
      return debt.current_amount;
    }
    
    // Calcular diferença em dias e converter para meses
    const diffTime = now.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const monthsElapsed = Math.max(0, diffDays / 30); // Considera 30 dias por mês
    
    // Se passou menos de um dia após vencimento, não aplica juros
    if (diffDays < 1) {
      return debt.current_amount;
    }

    // Aplicar juros compostos mensais ao saldo atual
    const monthlyRate = debt.monthly_interest_rate / 100;
    const currentAmount = debt.current_amount * Math.pow(1 + monthlyRate, monthsElapsed);
    
    return currentAmount;
  };

  const getDebtProgress = (debt: Debt) => {
    const currentAmountWithInterest = calculateCurrentAmount(debt);
    const actualPaid = Math.max(0, debt.original_amount - debt.current_amount);
    const totalDebtWithInterest = currentAmountWithInterest + actualPaid;
    const percentage = totalDebtWithInterest > 0 ? (actualPaid / totalDebtWithInterest) * 100 : 0;
    return Math.max(0, Math.min(100, percentage));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      original_amount: '',
      monthly_interest_rate: '',
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
      monthly_interest_rate: debt.monthly_interest_rate?.toString() || '',
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

  const openPaymentModal = (debt: Debt) => {
    const currentAmount = calculateCurrentAmount(debt);
    setPayingDebt(debt);
    setPaymentData({
      amount: '',
      bank_account_id: '',
      description: `Pagamento de ${debt.name}`
    });
    setPaymentModalOpen(true);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: '',
      bank_account_id: '',
      description: ''
    });
    setProcessingPayment(false);
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
          current_amount: parseFloat(formData.original_amount), // Valor atual = valor original inicialmente
          monthly_interest_rate: formData.monthly_interest_rate ? parseFloat(formData.monthly_interest_rate) : null,
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
          monthly_interest_rate: formData.monthly_interest_rate ? parseFloat(formData.monthly_interest_rate) : null,
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

  const handlePayment = async () => {
    if (!user || !payingDebt || !paymentData.amount.trim() || !paymentData.bank_account_id || processingPayment) return;
    
    const currentAmountWithInterest = calculateCurrentAmount(payingDebt);
    const paymentAmount = parseFloat(paymentData.amount);
    if (paymentAmount <= 0 || paymentAmount > currentAmountWithInterest) return;

    setProcessingPayment(true);

    try {
      // Criar transação de despesa (pagamento da dívida)
      const { error: transactionError } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'despesa',
          value: paymentAmount,
          description: paymentData.description.trim() || `Pagamento de ${payingDebt.name}`,
          bank_account_id: paymentData.bank_account_id,
          transaction_date: new Date().toISOString().split('T')[0],
        }
      ]);

      if (transactionError) throw transactionError;

      // Calcular novo valor atual após pagamento
      // O novo current_amount será o valor com juros menos o pagamento
      const newCurrentAmount = currentAmountWithInterest - paymentAmount;
      
      // Tentar atualizar com last_payment_date, se falhar, atualizar apenas current_amount
      let updateData: any = { current_amount: newCurrentAmount };
      
      try {
        // Tentar incluir last_payment_date
        updateData.last_payment_date = new Date().toISOString();
        const { error: debtError } = await supabase
          .from('debts')
          .update(updateData)
          .eq('id', payingDebt.id);
          
        if (debtError && debtError.message.includes('last_payment_date')) {
          // Se der erro na coluna last_payment_date, tentar sem ela
          delete updateData.last_payment_date;
          const { error: debtError2 } = await supabase
            .from('debts')
            .update(updateData)
            .eq('id', payingDebt.id);
          if (debtError2) throw debtError2;
        } else if (debtError) {
          throw debtError;
        }
      } catch (error) {
        throw error;
      }

      await loadDebts();
      setPaymentModalOpen(false);
      setPayingDebt(null);
      resetPaymentForm();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const totalOriginal = debts.reduce((sum, debt) => sum + debt.original_amount, 0);
  const totalCurrent = debts.reduce((sum, debt) => sum + calculateCurrentAmount(debt), 0);
  const totalPaid = debts.reduce((sum, debt) => sum + Math.max(0, debt.original_amount - debt.current_amount), 0);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dívidas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie suas dívidas e acompanhe o progresso dos pagamentos
          </p>
        </div>
        <Button onClick={openCreateModal} style={{ background: 'var(--expense-gradient)' }} className="w-full sm:w-auto">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Nova Dívida
        </Button>
      </div>

      {/* Resumo das Dívidas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card style={{ background: 'var(--expense-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Total em Dívidas</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(totalCurrent)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-success">
              {formatCurrency(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Valor Original</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(totalOriginal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Dívidas */}
      {debts.length === 0 ? (
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 p-4 sm:p-6">
            <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhuma dívida cadastrada</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6">
              Mantenha o controle das suas dívidas registrando-as aqui
            </p>
            <Button onClick={openCreateModal} style={{ background: 'var(--expense-gradient)' }} className="w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Registrar Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {debts.map((debt) => {
            const currentAmount = calculateCurrentAmount(debt);
            const progress = getDebtProgress(debt);
            const daysUntilDue = getDaysUntilDue(debt.due_date);
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
            const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;

            return (
              <Card key={debt.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{debt.name}</CardTitle>
                    <CardDescription>
                      {debt.creditor && (
                        <span className="text-xs">Credor: {debt.creditor}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openPaymentModal(debt)} 
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-success hover:text-success"
                      disabled={currentAmount <= 0}
                      title="Fazer pagamento"
                    >
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(debt)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => openDeleteModal(debt)}>
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Valor Original</p>
                        <p className="font-semibold text-sm sm:text-base">{formatCurrency(debt.original_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs sm:text-sm">Valor Atual</p>
                        <p className="font-semibold text-expense text-sm sm:text-base">{formatCurrency(currentAmount)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Progresso do Pagamento</span>
                        <span className="text-xs sm:text-sm font-semibold text-success">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5 sm:h-2" />
                      <p className="text-xs mt-1 text-success">
                        Pago: {formatCurrency(Math.max(0, debt.original_amount - debt.current_amount))}
                      </p>
                    </div>

                    {debt.due_date && (
                      <div className="flex items-center gap-2">
                        <AlertCircle 
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${
                            isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : 'text-muted-foreground'
                          }`} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm">
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

                    {debt.monthly_interest_rate && (
                      <div className="text-xs text-muted-foreground">
                        Taxa de juros: {debt.monthly_interest_rate}% ao mês
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
              <Label htmlFor="name" className="text-sm font-medium">Nome da Dívida</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="original_amount" className="text-sm font-medium">Valor da Dívida *</Label>
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
                <Label htmlFor="monthly_interest_rate" className="text-sm font-medium">Taxa de Juros (% ao mês)</Label>
                <Input
                  id="monthly_interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.monthly_interest_rate}
                  onChange={(e) => setFormData({ ...formData, monthly_interest_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date" className="text-sm font-medium">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditor" className="text-sm font-medium">Credor</Label>
              <Input
                id="creditor"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                placeholder="Ex: Banco XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a dívida"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleCreate} style={{ background: 'var(--expense-gradient)' }} className="w-full sm:w-auto">
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
              <Label htmlFor="edit-name" className="text-sm font-medium">Nome da Dívida</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-original_amount" className="text-sm font-medium">Valor da Dívida *</Label>
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
                <Label htmlFor="edit-monthly_interest_rate" className="text-sm font-medium">Taxa de Juros (% ao mês)</Label>
                <Input
                  id="edit-monthly_interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.monthly_interest_rate}
                  onChange={(e) => setFormData({ ...formData, monthly_interest_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-due_date" className="text-sm font-medium">Data de Vencimento</Label>
              <Input
                id="edit-due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-creditor" className="text-sm font-medium">Credor</Label>
              <Input
                id="edit-creditor"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                placeholder="Ex: Banco XYZ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a dívida"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleEdit} style={{ background: 'var(--expense-gradient)' }} className="w-full sm:w-auto">
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
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para Pagamento de Dívida */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento de Dívida</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {payingDebt && (
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Dívida</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{payingDebt.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Saldo atual: {formatCurrency(calculateCurrentAmount(payingDebt))}
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="payment-amount" className="text-sm font-medium">Valor do Pagamento *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                placeholder="0.00"
                max={payingDebt ? calculateCurrentAmount(payingDebt) : undefined}
              />
              {payingDebt && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPaymentData({ ...paymentData, amount: calculateCurrentAmount(payingDebt).toFixed(2) })}
                  >
                    Quitar Total
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPaymentData({ ...paymentData, amount: (calculateCurrentAmount(payingDebt) / 2).toFixed(2) })}
                  >
                    50% do Saldo
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-bank-account" className="text-sm font-medium">Conta para Débito *</Label>
              <Select
                value={paymentData.bank_account_id}
                onValueChange={(value) => setPaymentData({ ...paymentData, bank_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
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

            <div className="grid gap-2">
              <Label htmlFor="payment-description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="payment-description"
                value={paymentData.description}
                onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                placeholder="Descrição do pagamento"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={
                processingPayment ||
                !paymentData.amount.trim() || 
                !paymentData.bank_account_id ||
                parseFloat(paymentData.amount) <= 0 ||
                parseFloat(paymentData.amount) > (payingDebt ? calculateCurrentAmount(payingDebt) : 0)
              }
              style={{ background: processingPayment ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              className="w-full sm:w-auto text-white hover:opacity-90 transition-opacity"
            >
              {processingPayment ? 'Processando...' : 'Processar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface BankAccount {
  id: string;
  name: string;
  initial_balance: number;
  current_balance?: number;
  description: string | null;
  created_at: string;
}

const BankAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initial_balance: '',
    description: ''
  });
  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      // Buscar contas bancárias
      const { data: accountsData, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      // Calcular saldo atual para cada conta
      const accountsWithBalance = await Promise.all(
        (accountsData || []).map(async (account) => {
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('type, value')
            .eq('bank_account_id', account.id)
            .eq('user_id', user.id);

          if (transactionsError) {
            console.error('Erro ao carregar transações:', transactionsError);
            return { ...account, current_balance: account.initial_balance };
          }

          // Calcular saldo atual: saldo inicial + receitas - despesas
          const transactionBalance = (transactions || []).reduce((acc, transaction) => {
            return transaction.type === 'receita' 
              ? acc + transaction.value 
              : acc - transaction.value;
          }, 0);

          return {
            ...account,
            current_balance: account.initial_balance + transactionBalance
          };
        })
      );

      setAccounts(accountsWithBalance);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
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

  const formatDate = (dateString: string) => {
    // Adicionar o horário para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      initial_balance: '',
      description: ''
    });
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          initial_balance: parseFloat(formData.initial_balance) || 0,
          description: formData.description.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      // Recalcular saldo atual para a nova conta
      const newAccountWithBalance = { ...data, current_balance: data.initial_balance };
      setAccounts(prev => [newAccountWithBalance, ...prev]);
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
    }
  };

  const handleEdit = async () => {
    if (!user || !editingAccount || !formData.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update({
          name: formData.name.trim(),
          initial_balance: parseFloat(formData.initial_balance) || 0,
          description: formData.description.trim() || null
        })
        .eq('id', editingAccount.id)
        .select()
        .single();

      if (error) throw error;

      // Recalcular saldo se o saldo inicial foi alterado
      setAccounts(prev => {
        const updatedAccount = prev.find(acc => acc.id === editingAccount.id);
        if (updatedAccount && updatedAccount.initial_balance !== data.initial_balance) {
          // Se o saldo inicial mudou, recalcular baseado na diferença
          const balanceDifference = data.initial_balance - updatedAccount.initial_balance;
          const newCurrentBalance = (updatedAccount.current_balance ?? updatedAccount.initial_balance) + balanceDifference;
          const accountWithBalance = { ...data, current_balance: newCurrentBalance };
          return prev.map(acc => acc.id === editingAccount.id ? accountWithBalance : acc);
        } else {
          // Se apenas outros campos mudaram, manter saldo atual
          const accountWithBalance = { ...data, current_balance: updatedAccount?.current_balance ?? data.initial_balance };
          return prev.map(acc => acc.id === editingAccount.id ? accountWithBalance : acc);
        }
      });
      setEditModalOpen(false);
      setEditingAccount(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao editar conta:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
    }
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      initial_balance: account.initial_balance.toString(),
      description: account.description || ''
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const resetTransferForm = () => {
    setTransferData({
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      description: ''
    });
  };

  const openTransferModal = () => {
    resetTransferForm();
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!user || !transferData.fromAccountId || !transferData.toAccountId || !transferData.amount.trim()) return;
    
    const amount = parseFloat(transferData.amount);
    if (amount <= 0) return;

    // Verificar se as contas são diferentes
    if (transferData.fromAccountId === transferData.toAccountId) return;

    // Verificar se a conta de origem tem saldo suficiente
    const fromAccount = accounts.find(acc => acc.id === transferData.fromAccountId);
    const availableBalance = fromAccount?.current_balance ?? fromAccount?.initial_balance ?? 0;
    if (!fromAccount || availableBalance < amount) return;

    try {
      // Criar duas transações: uma de saída e uma de entrada
      const description = transferData.description.trim() || 'Transferência entre contas';
      const toAccountName = accounts.find(acc => acc.id === transferData.toAccountId)?.name || 'Conta desconhecida';
      const fromAccountName = fromAccount.name;

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'despesa',
          value: amount,
          description: `${description} - para ${toAccountName}`,
          bank_account_id: transferData.fromAccountId,
          transaction_date: new Date().toISOString().split('T')[0],
        },
        {
          user_id: user.id,
          type: 'receita',
          value: amount,
          description: `${description} - de ${fromAccountName}`,
          bank_account_id: transferData.toAccountId,
          transaction_date: new Date().toISOString().split('T')[0],
        }
      ]);

      if (error) throw error;

      setTransferModalOpen(false);
      resetTransferForm();
      loadAccounts(); // Recarregar contas para atualizar os saldos
    } catch (error) {
      console.error('Erro ao fazer transferência:', error);
    }
  };

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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Contas Bancárias</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie suas contas e acompanhe seus saldos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button style={{ background: 'var(--income-gradient)' }} onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Nova Conta
          </Button>
          {accounts.length >= 2 && (
            <Button variant="outline" onClick={openTransferModal} className="w-full sm:w-auto">
              <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Transferir
            </Button>
          )}
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 p-4 sm:p-6">
            <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-6">
              Comece criando sua primeira conta bancária para gerenciar suas finanças
            </p>
            <Button style={{ background: 'var(--income-gradient)' }} onClick={openCreateModal} className="w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Criar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <div className="space-y-1">
                  <CardTitle className="text-base sm:text-lg">{account.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Criada em {formatDate(account.created_at)}
                  </CardDescription>
                </div>
                <div className="p-1.5 sm:p-2 rounded-lg" style={{ background: 'var(--income-gradient)' }}>
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Saldo Atual</p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {formatCurrency(account.current_balance ?? account.initial_balance)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Saldo Inicial</p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(account.initial_balance)}
                    </p>
                  </div>
                  
                  {account.description && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Descrição</p>
                      <p className="text-xs sm:text-sm">{account.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                    <Button variant="outline" size="sm" className="flex-1 w-full" onClick={() => openEditModal(account)}>
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive w-full sm:w-auto">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0" />
                          <span className="sm:hidden ml-2">Deletar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente a conta bancária "{account.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(account.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova conta bancária
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left sm:text-right font-medium">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-1 sm:col-span-3"
                placeholder="Ex: Conta Corrente"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-left sm:text-right font-medium">
                Saldo Inicial
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-1 sm:col-span-3"
                placeholder="Descrição opcional da conta"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()} className="w-full sm:w-auto">
              Criar Conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Conta Bancária</DialogTitle>
            <DialogDescription>
              Altere os dados da conta bancária
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-left sm:text-right font-medium">
                Nome *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-1 sm:col-span-3"
                placeholder="Ex: Conta Corrente"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-balance" className="text-left sm:text-right font-medium">
                Saldo Inicial
              </Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-1 sm:col-span-3"
                placeholder="Descrição opcional da conta"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name.trim()} className="w-full sm:w-auto">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transferir entre Contas</DialogTitle>
            <DialogDescription>
              Transfira valores entre suas contas bancárias
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="from-account" className="text-left sm:text-right font-medium">
                Conta Origem *
              </Label>
              <Select
                value={transferData.fromAccountId}
                onValueChange={(value) =>
                  setTransferData(prev => ({ ...prev, fromAccountId: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione conta de origem" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.current_balance ?? account.initial_balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="to-account" className="text-left sm:text-right font-medium">
                Conta Destino *
              </Label>
              <Select
                value={transferData.toAccountId}
                onValueChange={(value) =>
                  setTransferData(prev => ({ ...prev, toAccountId: value }))
                }
              >
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(account => account.id !== transferData.fromAccountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.current_balance ?? account.initial_balance)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="transfer-amount" className="text-left sm:text-right font-medium">
                Valor *
              </Label>
              <div className="col-span-1 sm:col-span-3 space-y-2">
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData(prev => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
                {transferData.fromAccountId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const fromAccount = accounts.find(acc => acc.id === transferData.fromAccountId);
                      if (fromAccount) {
                        const availableBalance = fromAccount.current_balance ?? fromAccount.initial_balance;
                        setTransferData(prev => ({ ...prev, amount: availableBalance.toString() }));
                      }
                    }}
                  >
                    Transferir todo o saldo ({
                      formatCurrency(
                        accounts.find(acc => acc.id === transferData.fromAccountId)?.current_balance ??
                        accounts.find(acc => acc.id === transferData.fromAccountId)?.initial_balance ?? 0
                      )
                    })
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="transfer-description" className="text-left sm:text-right font-medium">
                Descrição
              </Label>
              <Textarea
                id="transfer-description"
                value={transferData.description}
                onChange={(e) =>
                  setTransferData(prev => ({ ...prev, description: e.target.value }))
                }
                className="col-span-1 sm:col-span-3"
                placeholder="Descrição da transferência (opcional)"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTransferModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={(() => {
                if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount.trim()) return true;
                if (transferData.fromAccountId === transferData.toAccountId) return true;
                
                const amount = parseFloat(transferData.amount);
                if (amount <= 0) return true;
                
                const fromAccount = accounts.find(acc => acc.id === transferData.fromAccountId);
                if (!fromAccount) return true;
                
                const availableBalance = fromAccount.current_balance ?? fromAccount.initial_balance;
                return availableBalance < amount;
              })()}
              className="w-full sm:w-auto"
            >
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankAccounts;
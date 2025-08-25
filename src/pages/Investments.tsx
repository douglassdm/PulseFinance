import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Investment {
  id: string;
  name: string;
  type: 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros';
  initial_amount: number;
  current_amount: number;
  purchase_date: string;
  description: string | null;
  created_at: string;
}

const investmentTypeLabels = {
  acao: 'Ações',
  fundo: 'Fundos',
  criptomoeda: 'Criptomoedas',
  renda_fixa: 'Renda Fixa',
  outros: 'Outros'
};

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'acao' as 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros',
    initial_amount: '',
    current_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  const loadInvestments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateReturn = (initial: number, current: number) => {
    const returnValue = current - initial;
    const returnPercentage = (returnValue / initial) * 100;
    return { returnValue, returnPercentage };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'acao',
      initial_amount: '',
      current_amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim() || !formData.initial_amount.trim() || !formData.current_amount.trim()) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          type: formData.type,
          initial_amount: parseFloat(formData.initial_amount),
          current_amount: parseFloat(formData.current_amount),
          purchase_date: formData.purchase_date,
          description: formData.description.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setInvestments(prev => [data, ...prev]);
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
    }
  };

  const handleEdit = async () => {
    if (!user || !editingInvestment || !formData.name.trim() || !formData.initial_amount.trim() || !formData.current_amount.trim()) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .update({
          name: formData.name.trim(),
          type: formData.type,
          initial_amount: parseFloat(formData.initial_amount),
          current_amount: parseFloat(formData.current_amount),
          purchase_date: formData.purchase_date,
          description: formData.description.trim() || null
        })
        .eq('id', editingInvestment.id)
        .select()
        .single();

      if (error) throw error;

      setInvestments(prev => prev.map(inv => inv.id === editingInvestment.id ? data : inv));
      setEditModalOpen(false);
      setEditingInvestment(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao editar investimento:', error);
    }
  };

  const handleDelete = async (investmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);

      if (error) throw error;

      setInvestments(prev => prev.filter(inv => inv.id !== investmentId));
    } catch (error) {
      console.error('Erro ao deletar investimento:', error);
    }
  };

  const openEditModal = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      initial_amount: investment.initial_amount.toString(),
      current_amount: investment.current_amount.toString(),
      purchase_date: investment.purchase_date,
      description: investment.description || ''
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.initial_amount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.current_amount, 0);
  const totalReturn = calculateReturn(totalInvested, totalCurrent);

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
          <h2 className="text-3xl font-bold tracking-tight">Investimentos</h2>
          <p className="text-muted-foreground">
            Acompanhe a performance dos seus investimentos
          </p>
        </div>
        <Button style={{ background: 'var(--investment-gradient)' }} onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Resumo dos Investimentos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card style={{ background: 'var(--investment-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Investido</CardTitle>
            <PiggyBank className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrent)}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidade</CardTitle>
            <TrendingUp className={`h-4 w-4 ${totalReturn.returnValue >= 0 ? 'text-success' : 'text-expense'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalReturn.returnValue >= 0 ? 'text-success' : 'text-expense'}`}>
              {totalReturn.returnValue >= 0 ? '+' : ''}{formatCurrency(totalReturn.returnValue)}
            </div>
            <p className={`text-xs ${totalReturn.returnValue >= 0 ? 'text-success' : 'text-expense'}`}>
              {totalReturn.returnPercentage >= 0 ? '+' : ''}{totalReturn.returnPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Investimentos */}
      {investments.length === 0 ? (
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum investimento cadastrado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Comece a registrar seus investimentos para acompanhar sua rentabilidade
            </p>
            <Button style={{ background: 'var(--investment-gradient)' }} onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Primeiro Investimento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {investments.map((investment) => {
            const returnData = calculateReturn(investment.initial_amount, investment.current_amount);
            return (
              <Card key={investment.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{investment.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">
                        {investmentTypeLabels[investment.type]}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(investment)}>
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
                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente o investimento "{investment.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(investment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                        <p className="text-muted-foreground">Investido</p>
                        <p className="font-semibold">{formatCurrency(investment.initial_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold">{formatCurrency(investment.current_amount)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Rentabilidade</span>
                        <span className={`text-sm font-semibold ${returnData.returnValue >= 0 ? 'text-success' : 'text-expense'}`}>
                          {returnData.returnValue >= 0 ? '+' : ''}{returnData.returnPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.abs(returnData.returnPercentage)} 
                        className="h-2"
                      />
                      <p className={`text-xs mt-1 ${returnData.returnValue >= 0 ? 'text-success' : 'text-expense'}`}>
                        {returnData.returnValue >= 0 ? '+' : ''}{formatCurrency(returnData.returnValue)}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>Comprado em: {formatDate(investment.purchase_date)}</p>
                      {investment.description && <p className="mt-1">{investment.description}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Investimento</DialogTitle>
            <DialogDescription>
              Registre um novo investimento para acompanhar sua performance
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: Tesouro Direto IPCA+"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acao">Ações</SelectItem>
                  <SelectItem value="fundo">Fundos</SelectItem>
                  <SelectItem value="criptomoeda">Criptomoedas</SelectItem>
                  <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initial_amount" className="text-right">
                Valor Inicial *
              </Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                value={formData.initial_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current_amount" className="text-right">
                Valor Atual *
              </Label>
              <Input
                id="current_amount"
                type="number"
                step="0.01"
                value={formData.current_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchase_date" className="text-right">
                Data da Compra *
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Descrição opcional do investimento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim() || !formData.initial_amount.trim() || !formData.current_amount.trim()}>
              Criar Investimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Investimento</DialogTitle>
            <DialogDescription>
              Altere os dados do investimento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: Tesouro Direto IPCA+"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Tipo *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acao">Ações</SelectItem>
                  <SelectItem value="fundo">Fundos</SelectItem>
                  <SelectItem value="criptomoeda">Criptomoedas</SelectItem>
                  <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-initial_amount" className="text-right">
                Valor Inicial *
              </Label>
              <Input
                id="edit-initial_amount"
                type="number"
                step="0.01"
                value={formData.initial_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-current_amount" className="text-right">
                Valor Atual *
              </Label>
              <Input
                id="edit-current_amount"
                type="number"
                step="0.01"
                value={formData.current_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-purchase_date" className="text-right">
                Data da Compra *
              </Label>
              <Input
                id="edit-purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Descrição opcional do investimento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name.trim() || !formData.initial_amount.trim() || !formData.current_amount.trim()}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investments;
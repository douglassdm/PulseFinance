import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, PiggyBank, History, ArrowUpDown } from 'lucide-react';
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
  symbol: string | null;
  type: 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros';
  quantity: number;
  initial_amount: number;
  current_amount: number;
  purchase_date: string;
  brokerage: string | null;
  currency: string;
  description: string | null;
  average_purchase_price?: number;
  current_market_price?: number;
  last_price_update?: string;
  created_at: string;
  updated_at: string;
}

interface InvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'SPLIT' | 'BONUS' | 'OTHER';
  transaction_date: string;
  quantity?: number;
  price_per_unit?: number;
  total_amount: number;
  fees: number;
  taxes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const investmentTypeLabels = {
  acao: 'Ações',
  fundo: 'Fundos',
  criptomoeda: 'Criptomoedas',
  renda_fixa: 'Renda Fixa',
  outros: 'Outros'
};

const transactionTypeLabels = {
  BUY: 'Compra',
  SELL: 'Venda',
  DIVIDEND: 'Dividendo',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retirada',
  FEE: 'Taxa',
  SPLIT: 'Desdobramento',
  BONUS: 'Bonificação',
  OTHER: 'Outros'
};

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionsViewOpen, setTransactionsViewOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'acao' as 'acao' | 'fundo' | 'criptomoeda' | 'renda_fixa' | 'outros',
    quantity: '',
    initial_amount: '',
    current_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    brokerage: '',
    currency: 'BRL',
    description: ''
  });

  const [transactionFormData, setTransactionFormData] = useState({
    transaction_type: 'BUY' as 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'SPLIT' | 'BONUS' | 'OTHER',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: '',
    total_amount: '',
    fees: '0',
    taxes: '0',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadInvestments();
      loadTransactions();
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

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investment_transactions')
        .select(`
          *,
          investments!inner(
            name,
            user_id
          )
        `)
        .eq('investments.user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
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
    const returnPercentage = initial > 0 ? (returnValue / initial) * 100 : 0;
    return { returnValue, returnPercentage };
  };

  const calculateCurrentValue = (investment: Investment) => {
    if (investment.current_market_price && investment.quantity) {
      return investment.current_market_price * investment.quantity;
    }
    return investment.current_amount;
  };

  const getAveragePurchasePrice = (investment: Investment) => {
    if (investment.average_purchase_price) {
      return investment.average_purchase_price;
    }
    if (investment.quantity > 0) {
      return investment.initial_amount / investment.quantity;
    }
    return 0;
  };

  const calculateTotalValue = (quantity: number, price: number) => {
    return quantity * price;
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      type: 'acao',
      quantity: '',
      initial_amount: '',
      current_amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      brokerage: '',
      currency: 'BRL',
      description: ''
    });
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim() || !formData.quantity.trim() || !formData.initial_amount.trim()) return;

    try {
      const quantity = parseFloat(formData.quantity);
      const initialAmount = parseFloat(formData.initial_amount);
      const currentAmount = formData.current_amount ? parseFloat(formData.current_amount) : initialAmount;
      const pricePerUnit = quantity > 0 ? initialAmount / quantity : 0;

      // Primeiro, criar o investimento
      const { data: investmentData, error: investmentError } = await supabase
        .from('investments')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          symbol: formData.symbol.trim() || null,
          type: formData.type,
          quantity: quantity,
          initial_amount: initialAmount,
          current_amount: currentAmount,
          purchase_date: formData.purchase_date,
          brokerage: formData.brokerage.trim() || null,
          currency: formData.currency,
          description: formData.description.trim() || null,
          average_purchase_price: pricePerUnit
        }])
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Depois, criar a transação inicial de compra
      const { error: transactionError } = await supabase
        .from('investment_transactions')
        .insert([{
          investment_id: investmentData.id,
          transaction_type: 'BUY',
          transaction_date: formData.purchase_date,
          quantity: quantity,
          price_per_unit: pricePerUnit,
          total_amount: initialAmount,
          fees: 0,
          taxes: 0,
          description: 'Compra inicial do investimento'
        }]);

      if (transactionError) throw transactionError;

      // Atualizar listas
      setInvestments(prev => [investmentData, ...prev]);
      loadTransactions(); // Recarregar transações para incluir a nova
      
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
    }
  };

  const handleEdit = async () => {
    if (!user || !editingInvestment || !formData.name.trim() || !formData.quantity.trim() || !formData.initial_amount.trim()) return;

    try {
      const quantity = parseFloat(formData.quantity);
      const initialAmount = parseFloat(formData.initial_amount);
      const currentAmount = formData.current_amount ? parseFloat(formData.current_amount) : initialAmount;

      const { data, error } = await supabase
        .from('investments')
        .update({
          name: formData.name.trim(),
          symbol: formData.symbol.trim() || null,
          type: formData.type,
          quantity: quantity,
          initial_amount: initialAmount,
          current_amount: currentAmount,
          purchase_date: formData.purchase_date,
          brokerage: formData.brokerage.trim() || null,
          currency: formData.currency,
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
      symbol: investment.symbol || '',
      type: investment.type,
      quantity: investment.quantity?.toString() || '1',
      initial_amount: investment.initial_amount.toString(),
      current_amount: investment.current_amount.toString(),
      purchase_date: investment.purchase_date,
      brokerage: investment.brokerage || '',
      currency: investment.currency || 'BRL',
      description: investment.description || ''
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openTransactionModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionFormData({
      transaction_type: 'BUY',
      transaction_date: new Date().toISOString().split('T')[0],
      quantity: '',
      price_per_unit: '',
      total_amount: '',
      fees: '0',
      taxes: '0',
      description: ''
    });
    setTransactionModalOpen(true);
  };

  const openTransactionsView = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionsViewOpen(true);
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      transaction_type: 'BUY',
      transaction_date: new Date().toISOString().split('T')[0],
      quantity: '',
      price_per_unit: '',
      total_amount: '',
      fees: '0',
      taxes: '0',
      description: ''
    });
  };

  const handleCreateTransaction = async () => {
    if (!user || !selectedInvestment || !transactionFormData.total_amount.trim()) return;

    try {
      const transactionData = {
        investment_id: selectedInvestment.id,
        transaction_type: transactionFormData.transaction_type,
        transaction_date: transactionFormData.transaction_date,
        quantity: transactionFormData.quantity ? parseFloat(transactionFormData.quantity) : null,
        price_per_unit: transactionFormData.price_per_unit ? parseFloat(transactionFormData.price_per_unit) : null,
        total_amount: parseFloat(transactionFormData.total_amount),
        fees: parseFloat(transactionFormData.fees),
        taxes: parseFloat(transactionFormData.taxes),
        description: transactionFormData.description.trim() || null
      };

      const { data, error } = await supabase
        .from('investment_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista de transações
      loadTransactions();
      
      // Atualizar investimentos para refletir mudanças
      loadInvestments();
      
      setTransactionModalOpen(false);
      resetTransactionForm();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  const getInvestmentTransactions = (investmentId: string) => {
    return transactions.filter(t => t.investment_id === investmentId);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.initial_amount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + calculateCurrentValue(inv), 0);
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
            const returnData = calculateReturn(investment.initial_amount, calculateCurrentValue(investment));
            return (
              <Card key={investment.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {investment.name}
                      {investment.symbol && <span className="text-sm text-muted-foreground ml-2">({investment.symbol})</span>}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {investmentTypeLabels[investment.type]}
                      </Badge>
                      {investment.brokerage && (
                        <Badge variant="secondary" className="text-xs">
                          {investment.brokerage}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openTransactionsView(investment)} title="Ver transações">
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openTransactionModal(investment)} title="Nova transação">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
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
                        <p className="text-muted-foreground">Quantidade</p>
                        <p className="font-semibold">{formatQuantity(investment.quantity || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preço Médio</p>
                        <p className="font-semibold">{formatCurrency(getAveragePurchasePrice(investment))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preço Atual</p>
                        <p className="font-semibold">
                          {investment.current_market_price ? 
                            formatCurrency(investment.current_market_price) : 
                            <span className="text-muted-foreground text-xs">N/A</span>
                          }
                          {investment.currency !== 'BRL' && investment.current_market_price && (
                            <span className="text-xs text-muted-foreground ml-1">({investment.currency})</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-semibold">
                          {formatCurrency(calculateCurrentValue(investment))}
                          {investment.currency !== 'BRL' && (
                            <span className="text-xs text-muted-foreground ml-1">({investment.currency})</span>
                          )}
                        </p>
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-hide">
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
              <Label htmlFor="symbol" className="text-right">
                Símbolo
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: PETR4, AAPL"
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
              <Label htmlFor="quantity" className="text-right">
                Quantidade *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="col-span-3"
                placeholder="1.0"
              />
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
              <Label htmlFor="brokerage" className="text-right">
                Corretora
              </Label>
              <Input
                id="brokerage"
                value={formData.brokerage}
                onChange={(e) => setFormData(prev => ({ ...prev, brokerage: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: XP Investimentos, Clear"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Moeda
              </Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleCreate} disabled={!formData.name.trim() || !formData.quantity.trim() || !formData.initial_amount.trim()}>
              Criar Investimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-hide">
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
              <Label htmlFor="edit-symbol" className="text-right">
                Símbolo
              </Label>
              <Input
                id="edit-symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: PETR4, AAPL"
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
              <Label htmlFor="edit-quantity" className="text-right">
                Quantidade *
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="col-span-3"
                placeholder="1.0"
              />
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
              <Label htmlFor="edit-brokerage" className="text-right">
                Corretora
              </Label>
              <Input
                id="edit-brokerage"
                value={formData.brokerage}
                onChange={(e) => setFormData(prev => ({ ...prev, brokerage: e.target.value }))}
                className="col-span-3"
                placeholder="Ex: XP Investimentos, Clear"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-currency" className="text-right">
                Moeda
              </Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleEdit} disabled={!formData.name.trim() || !formData.quantity.trim() || !formData.initial_amount.trim()}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Transação */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Nova Transação - {selectedInvestment?.name}</DialogTitle>
            <DialogDescription>
              Registre uma nova transação para este investimento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_type" className="text-right">
                Tipo *
              </Label>
              <Select value={transactionFormData.transaction_type} onValueChange={(value: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'SPLIT' | 'BONUS' | 'OTHER') => setTransactionFormData(prev => ({ ...prev, transaction_type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Compra</SelectItem>
                  <SelectItem value="SELL">Venda</SelectItem>
                  <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                  <SelectItem value="DEPOSIT">Depósito</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retirada</SelectItem>
                  <SelectItem value="FEE">Taxa</SelectItem>
                  <SelectItem value="SPLIT">Desdobramento</SelectItem>
                  <SelectItem value="BONUS">Bonificação</SelectItem>
                  <SelectItem value="OTHER">Outros</SelectItem>
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
                value={transactionFormData.transaction_date}
                onChange={(e) => setTransactionFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="col-span-3"
              />
            </div>
            {(transactionFormData.transaction_type === 'BUY' || transactionFormData.transaction_type === 'SELL') && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.00000001"
                    value={transactionFormData.quantity}
                    onChange={(e) => setTransactionFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="col-span-3"
                    placeholder="0.0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price_per_unit" className="text-right">
                    Preço por Unidade
                  </Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={transactionFormData.price_per_unit}
                    onChange={(e) => setTransactionFormData(prev => ({ ...prev, price_per_unit: e.target.value }))}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total_amount" className="text-right">
                Valor Total *
              </Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={transactionFormData.total_amount}
                onChange={(e) => setTransactionFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fees" className="text-right">
                Taxas
              </Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                value={transactionFormData.fees}
                onChange={(e) => setTransactionFormData(prev => ({ ...prev, fees: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxes" className="text-right">
                Impostos
              </Label>
              <Input
                id="taxes"
                type="number"
                step="0.01"
                value={transactionFormData.taxes}
                onChange={(e) => setTransactionFormData(prev => ({ ...prev, taxes: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="transaction_description"
                value={transactionFormData.description}
                onChange={(e) => setTransactionFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Descrição opcional da transação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTransaction} disabled={!transactionFormData.total_amount.trim()}>
              Criar Transação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualizar Transações */}
      <Dialog open={transactionsViewOpen} onOpenChange={setTransactionsViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Transações - {selectedInvestment?.name}</DialogTitle>
            <DialogDescription>
              Histórico completo de transações deste investimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvestment && getInvestmentTransactions(selectedInvestment.id).length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedInvestment && getInvestmentTransactions(selectedInvestment.id).map((transaction) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={transaction.transaction_type === 'BUY' ? 'default' : transaction.transaction_type === 'SELL' ? 'destructive' : 'secondary'}>
                            {transactionTypeLabels[transaction.transaction_type]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(transaction.transaction_date)}
                          </span>
                        </div>
                        {transaction.quantity && transaction.price_per_unit && (
                          <p className="text-sm">
                            {formatQuantity(transaction.quantity)} × {formatCurrency(transaction.price_per_unit)}
                          </p>
                        )}
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.transaction_type === 'SELL' || transaction.transaction_type === 'DIVIDEND' ? 'text-success' : ''}`}>
                          {transaction.transaction_type === 'SELL' || transaction.transaction_type === 'DIVIDEND' ? '+' : ''}
                          {formatCurrency(transaction.total_amount)}
                        </p>
                        {(transaction.fees > 0 || transaction.taxes > 0) && (
                          <p className="text-xs text-muted-foreground">
                            Taxas: {formatCurrency(transaction.fees)} | Impostos: {formatCurrency(transaction.taxes)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTransactionsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investments;
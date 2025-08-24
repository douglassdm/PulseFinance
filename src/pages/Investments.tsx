import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  description: string;
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
        <Button style={{ background: 'var(--investment-gradient)' }}>
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
            <Button style={{ background: 'var(--investment-gradient)' }}>
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
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default Investments;
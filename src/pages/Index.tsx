import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--income-gradient)' }}>
              <DollarSign className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Controle Total das Suas{' '}
            <span style={{ background: 'var(--income-gradient)', backgroundClip: 'text', color: 'transparent' }}>
              Finanças
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gerencie suas receitas, despesas, investimentos e metas financeiras 
            de forma simples e intuitiva. Tome decisões mais inteligentes com seus dados.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              style={{ background: 'var(--income-gradient)' }}
              onClick={() => navigate('/auth')}
            >
              Começar Gratuitamente
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recursos completos para um controle financeiro eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
            <CardHeader className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-4" style={{ background: 'var(--income-gradient)' }}>
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Dashboard Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Visualize suas finanças com gráficos e métricas em tempo real
              </CardDescription>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
            <CardHeader className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-4" style={{ background: 'var(--goal-gradient)' }}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle>100% Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Seus dados são protegidos com criptografia de ponta
              </CardDescription>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
            <CardHeader className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-4" style={{ background: 'var(--investment-gradient)' }}>
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Acesso Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Interface responsiva para acessar de qualquer dispositivo
              </CardDescription>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
            <CardHeader className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-4" style={{ background: 'var(--expense-gradient)' }}>
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Controle Total</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Gerencie receitas, despesas, investimentos e muito mais
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto text-center" style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-medium)' }}>
          <CardHeader className="pb-8">
            <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar suas finanças?
            </CardTitle>
            <CardDescription className="text-lg">
              Junte-se a milhares de usuários que já organizam suas finanças conosco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="px-12 py-4 text-lg"
              style={{ background: 'var(--income-gradient)' }}
              onClick={() => navigate('/auth')}
            >
              Começar Agora
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;

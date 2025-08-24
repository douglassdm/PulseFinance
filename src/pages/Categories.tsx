import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  created_at: string;
}

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const incomeCategories = categories.filter(cat => cat.type === 'receita');
  const expenseCategories = categories.filter(cat => cat.type === 'despesa');

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 border rounded">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CategoryGrid = ({ categories, type }: { categories: Category[], type: 'receita' | 'despesa' }) => (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhuma categoria de {type === 'receita' ? 'receita' : 'despesa'}
          </h3>
          <p className="text-muted-foreground mb-6">
            Crie categorias para organizar melhor suas {type === 'receita' ? 'receitas' : 'despesas'}
          </p>
          <Button style={{ background: type === 'receita' ? 'var(--income-gradient)' : 'var(--expense-gradient)' }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        background: category.type === 'receita' 
                          ? 'var(--income-gradient)' 
                          : 'var(--expense-gradient)' 
                      }}
                    >
                      <Tag className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge 
                  variant={category.type === 'receita' ? 'default' : 'destructive'}
                  className={category.type === 'receita' ? 'bg-success text-white' : 'bg-expense text-white'}
                >
                  {category.type === 'receita' ? 'Receita' : 'Despesa'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Criada em {formatDate(category.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
          <p className="text-muted-foreground">
            Organize suas transações em categorias personalizadas
          </p>
        </div>
        <Button style={{ background: 'var(--income-gradient)' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle>Suas Categorias</CardTitle>
          <CardDescription>
            {categories.length} categoria(s) cadastrada(s) • {incomeCategories.length} receita(s) • {expenseCategories.length} despesa(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas ({categories.length})</TabsTrigger>
              <TabsTrigger value="income">Receitas ({incomeCategories.length})</TabsTrigger>
              <TabsTrigger value="expense">Despesas ({expenseCategories.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <CategoryGrid categories={categories} type="receita" />
            </TabsContent>
            
            <TabsContent value="income" className="mt-6">
              <CategoryGrid categories={incomeCategories} type="receita" />
            </TabsContent>
            
            <TabsContent value="expense" className="mt-6">
              <CategoryGrid categories={expenseCategories} type="despesa" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;
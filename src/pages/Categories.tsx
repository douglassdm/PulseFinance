import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'receita' as 'receita' | 'despesa'
  });

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

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'receita'
    });
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          type: formData.type
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [data, ...prev]);
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  const handleEdit = async () => {
    if (!user || !editingCategory || !formData.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          type: formData.type
        })
        .eq('id', editingCategory.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? data : cat));
      setEditModalOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao editar categoria:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const incomeCategories = categories.filter(cat => cat.type === 'receita');
  const expenseCategories = categories.filter(cat => cat.type === 'despesa');

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="space-y-3 sm:space-y-4">
      {categories.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Tag className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Nenhuma categoria de {type === 'receita' ? 'receita' : 'despesa'}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Crie categorias para organizar melhor suas {type === 'receita' ? 'receitas' : 'despesas'}
          </p>
          <Button style={{ background: type === 'receita' ? 'var(--income-gradient)' : 'var(--expense-gradient)' }} onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                      style={{ 
                        background: category.type === 'receita' 
                          ? 'var(--income-gradient)' 
                          : 'var(--expense-gradient)' 
                      }}
                    >
                      <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base truncate">{category.name}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(category)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente a categoria "{category.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <Badge 
                  variant={category.type === 'receita' ? 'default' : 'destructive'}
                  className={category.type === 'receita' ? 'bg-success text-success-foreground text-xs' : 'bg-expense text-expense-foreground text-xs'}
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Categorias</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organize suas transações em categorias personalizadas
          </p>
        </div>
        <Button style={{ background: 'var(--income-gradient)' }} onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Suas Categorias</CardTitle>
          <CardDescription className="text-sm">
            {categories.length} categoria(s) cadastrada(s) • {incomeCategories.length} receita(s) • {expenseCategories.length} despesa(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Todas ({categories.length})</TabsTrigger>
              <TabsTrigger value="income" className="text-xs sm:text-sm">Receitas ({incomeCategories.length})</TabsTrigger>
              <TabsTrigger value="expense" className="text-xs sm:text-sm">Despesas ({expenseCategories.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4 sm:mt-6">
              <CategoryGrid categories={categories} type="receita" />
            </TabsContent>
            
            <TabsContent value="income" className="mt-4 sm:mt-6">
              <CategoryGrid categories={incomeCategories} type="receita" />
            </TabsContent>
            
            <TabsContent value="expense" className="mt-4 sm:mt-6">
              <CategoryGrid categories={expenseCategories} type="despesa" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar suas transações
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
                placeholder="Ex: Alimentação, Salário"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-left sm:text-right font-medium">
                Tipo *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'receita' | 'despesa') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()} className="w-full sm:w-auto">
              Criar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Altere os dados da categoria
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
                placeholder="Ex: Alimentação, Salário"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-left sm:text-right font-medium">
                Tipo *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'receita' | 'despesa') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-1 sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
};

export default Categories;
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface TagData {
  id: string;
  name: string;
  created_at: string;
  transaction_count?: number;
}

const Tags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  const loadTags = async () => {
    if (!user) return;

    try {
      // Buscar tags e contar quantas transações cada uma tem
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select(`
          id, name, created_at,
          transaction_tags(transaction_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tagsError) throw tagsError;

      const tagsWithCount = tagsData?.map(tag => ({
        ...tag,
        transaction_count: tag.transaction_tags?.length || 0
      })) || [];

      setTags(tagsWithCount);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTagColors = () => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
    ];
    return colors;
  };

  const tagColors = getTagColors();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
          <p className="text-muted-foreground">
            Organize suas transações com tags personalizadas
          </p>
        </div>
        <Button style={{ background: 'var(--income-gradient)' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {/* Estatísticas das Tags */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags em Uso</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(tag => (tag.transaction_count || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags Não Utilizadas</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(tag => (tag.transaction_count || 0) === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Busca */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle>Buscar Tags</CardTitle>
          <CardDescription>
            Encontre rapidamente suas tags pelo nome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tags */}
      <Card style={{ background: 'var(--card-gradient)', boxShadow: 'var(--shadow-soft)' }}>
        <CardHeader>
          <CardTitle>Suas Tags</CardTitle>
          <CardDescription>
            {filteredTags.length} tag(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? (
                <>
                  <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma tag encontrada</h3>
                  <p className="text-muted-foreground mb-6">
                    Tente buscar com outro termo ou crie uma nova tag
                  </p>
                  <Button style={{ background: 'var(--income-gradient)' }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Tag "{searchTerm}"
                  </Button>
                </>
              ) : (
                <>
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma tag criada</h3>
                  <p className="text-muted-foreground mb-6">
                    Comece criando suas primeiras tags para organizar melhor suas transações
                  </p>
                  <Button style={{ background: 'var(--income-gradient)' }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Primeira Tag
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTags.map((tag, index) => (
                <Card key={tag.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ background: 'var(--income-gradient)' }}
                        >
                          <Hash className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg">#{tag.name}</h3>
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
                    
                    <div className="space-y-2">
                      <Badge 
                        variant="outline"
                        className={`${tagColors[index % tagColors.length]} border`}
                      >
                        {tag.transaction_count || 0} transação(ões)
                      </Badge>
                      
                      <p className="text-xs text-muted-foreground">
                        Criada em {formatDate(tag.created_at)}
                      </p>
                      
                      {(tag.transaction_count || 0) === 0 && (
                        <p className="text-xs text-warning">
                          Tag não utilizada
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tags;
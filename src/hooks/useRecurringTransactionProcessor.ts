import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransaction {
  id: string;
  type: 'receita' | 'despesa';
  value: number;
  description: string;
  start_date: string;
  end_date: string | null;
  frequency: string;
  next_occurrence_date: string;
  category_id: string | null;
  bank_account_id: string;
}

export const useRecurringTransactionProcessor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastCheckRef = useRef<Date>();

  const calculateNextOccurrence = (currentDate: string, frequency: string): string => {
    const date = new Date(currentDate + 'T00:00:00');

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date.toISOString().split('T')[0];
  };

  const processRecurringTransactions = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`[RecurringProcessor] Verificando transações para ${today}`);
      
      // Buscar transações recorrentes que devem ser executadas hoje ou estão atrasadas
      const { data: transactions, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_occurrence_date', today) // Menor ou igual a hoje (incluindo atrasadas)
        .or('end_date.is.null,end_date.gte.' + today); // Ativas (sem data fim ou data fim no futuro)

      if (error) {
        console.error('Erro ao buscar transações recorrentes:', error);
        return;
      }

      if (!transactions || transactions.length === 0) {
        console.log('[RecurringProcessor] Nenhuma transação pendente encontrada');
        return;
      }

      console.log(`[RecurringProcessor] Encontradas ${transactions.length} transações para processar`);
      let processedCount = 0;

      for (const transaction of transactions) {
        try {
          // Verificar se ainda está no período ativo
          if (transaction.end_date && transaction.end_date < today) {
            continue;
          }

          // Criar a transação regular
          const { error: insertError } = await supabase
            .from('transactions')
            .insert([
              {
                user_id: user.id,
                type: transaction.type,
                value: transaction.value,
                description: transaction.description,
                transaction_date: today,
                paid_date: null,
                category_id: transaction.category_id,
                bank_account_id: transaction.bank_account_id,
              },
            ]);

          if (insertError) {
            console.error(`Erro ao criar transação para ${transaction.description}:`, insertError);
            continue;
          }

          // Atualizar a próxima data de ocorrência
          const nextOccurrence = calculateNextOccurrence(
            transaction.next_occurrence_date,
            transaction.frequency
          );

          const { error: updateError } = await supabase
            .from('recurring_transactions')
            .update({ next_occurrence_date: nextOccurrence })
            .eq('id', transaction.id);

          if (updateError) {
            console.error(`Erro ao atualizar próxima ocorrência para ${transaction.description}:`, updateError);
            continue;
          }

          console.log(`[RecurringProcessor] Transação processada: ${transaction.description}`);
          processedCount++;
        } catch (transactionError) {
          console.error(`Erro ao processar transação ${transaction.description}:`, transactionError);
        }
      }

      // Notificar usuário se transações foram processadas
      if (processedCount > 0) {
        console.log(`[RecurringProcessor] ${processedCount} transações processadas com sucesso`);
        toast({
          title: "Transações Recorrentes Executadas",
          description: `${processedCount} ${processedCount === 1 ? 'transação foi executada' : 'transações foram executadas'} automaticamente.`,
        });
      }
    } catch (error) {
      console.error('Erro no processamento de transações recorrentes:', error);
    }
  };

  const startProcessor = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log('[RecurringProcessor] Iniciando processador automático');

    // Executar imediatamente se nunca foi executado ou se passou mais de 1 hora
    const now = new Date();
    if (!lastCheckRef.current || (now.getTime() - lastCheckRef.current.getTime()) > 60 * 60 * 1000) {
      console.log('[RecurringProcessor] Executando verificação inicial');
      processRecurringTransactions();
      lastCheckRef.current = now;
    }

    // Configurar intervalo para verificar a cada 5 minutos
    intervalRef.current = setInterval(() => {
      const currentTime = new Date();
      lastCheckRef.current = currentTime;
      console.log('[RecurringProcessor] Verificação periódica iniciada');
      processRecurringTransactions();
    }, 5 * 60 * 1000); // 5 minutos
    
    console.log('[RecurringProcessor] Intervalo configurado para 5 minutos');
  };

  const stopProcessor = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  useEffect(() => {
    if (user) {
      startProcessor();
    } else {
      stopProcessor();
    }

    return () => {
      stopProcessor();
    };
  }, [user]);

  // Cleanup no desmonte do componente
  useEffect(() => {
    return () => {
      stopProcessor();
    };
  }, []);

  return {
    processRecurringTransactions,
    startProcessor,
    stopProcessor,
  };
};